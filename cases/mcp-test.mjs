import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import chalk from 'chalk';
import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence, RunnableLambda, RunnableBranch, RunnablePassthrough } from '@langchain/core/runnables';


const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "google-maps": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-google-maps"
      ],
      "env": {
        "GOOGLE_MAPS_API_KEY": process.env.GOOGLE_MAPS_API_KEY
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    },
  }
});

const tools = await mcpClient.getTools();

const modelWithTools = model.bindTools(tools);

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are an intelligent assistant that can call MCP tools.'],
  new MessagesPlaceholder('messages'),
]);

const llmChain = prompt.pipe(modelWithTools);

// 1) Define tool-call handling logic (wrapped as Runnable).
const toolExecutor = new RunnableLambda({
  func: async (input) => {
    const { response, tools } = input;
    const toolResults = [];

    for (const toolCall of response.tool_calls ?? []) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (!foundTool) continue;

      // Some providers return tool args as a JSON string; normalize before invoke.
      let normalizedArgs = toolCall.args ?? {};
      if (typeof normalizedArgs === 'string') {
        try {
          normalizedArgs = JSON.parse(normalizedArgs);
        } catch {
          // Keep raw string if it's not valid JSON; tool-side schema will decide.
        }
      }

      let contentStr;
      try {
        const toolResult = await foundTool.invoke(normalizedArgs);
        // Normalize different tool return formats into a string.
        contentStr = typeof toolResult === 'string'
          ? toolResult
          : (toolResult?.text || JSON.stringify(toolResult));
      } catch (error) {
        // Return tool errors to the model so it can retry with corrected args.
        const message = error instanceof Error ? error.message : String(error);
        contentStr = `Tool "${toolCall.name}" failed: ${message}`;
      }

      toolResults.push(new ToolMessage({
        content: contentStr,
        tool_call_id: toolCall.id,
      }));
    }

    return toolResults;
  },
});

// 2) Handle model output state transitions.
const agentStepChain = RunnableSequence.from([
  RunnablePassthrough.assign({
    response: llmChain,
  }),
  RunnableBranch.from([
    [
      (state) => !state.response.tool_calls || state.response.tool_calls.length === 0,
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          return {
            ...state,
            messages: newMessages,
            response,
            done: true,
            final: response.content,
          };
        },
      }),
    ],
    // Default branch: execute tool calls and append ToolMessages.
    RunnableSequence.from([
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];

          console.log(
            chalk.bgBlue(
              `🔍 Detected ${response.tool_calls.length} tool calls`,
            ),
          );
          console.log(
            chalk.bgBlue(
              `🔍 Tool calls: ${response.tool_calls
                .map((t) => t.name)
                .join(', ')}`,
            ),
          );

          return {
            ...state,
            messages: newMessages,
          };
        },
      }),
      // Execute tools and collect ToolMessages.
      RunnablePassthrough.assign({
        toolMessages: toolExecutor,
      }),
      new RunnableLambda({
        func: async (state) => {
          const { messages, toolMessages } = state;
          return {
            ...state,
            messages: [...messages, ...(toolMessages ?? [])],
            done: false,
          };
        },
      }),
    ]),
  ]),
]);

async function runAgentWithTools(query, maxIterations = 30) {
  let state = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools,
  };

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen('⏳ Waiting for AI reasoning...'));

    // Each turn runs one complete runnable chain (LLM + tool execution handling).
    state = await agentStepChain.invoke(state);

    if (state.done) {
      console.log(`\n✨ Final AI response:\n${state.final}\n`);
      return state.final;
    }
  }

  return state.messages[state.messages.length - 1].content;
}

try {
  await runAgentWithTools(
    'Find the three nearest hotels around Beijing South Railway Station, fetch hotel image pages, open one tab per hotel URL, and rename each tab title to the hotel name.',
  );
} finally {
  await mcpClient.close();
}