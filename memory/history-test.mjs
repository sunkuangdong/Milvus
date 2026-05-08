import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({ 
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function inMemoryDemo() {
  const history = new InMemoryChatMessageHistory();

  const systemMessage = new SystemMessage(
    "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
  );

  // First round of conversation
  console.log("[First Round of Conversation]");
  const userMessage1 = new HumanMessage(
    "你今天吃的什么？"
  );
  await history.addMessage(userMessage1);
  
  const messages1 = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages1);
  await history.addMessage(response1);
  
  console.log(`User: ${userMessage1.content}`);
  console.log(`Assistant: ${response1.content}\n`);

  // Second round of conversation (Based on History)
  console.log("[Second Round of Conversation - Based on History]");
  const userMessage2 = new HumanMessage(
    "好吃吗？"
  );
  await history.addMessage(userMessage2);
  
  const messages2 = [systemMessage, ...(await history.getMessages())];
  const response2 = await model.invoke(messages2);
  await history.addMessage(response2);
  
  console.log(`User: ${userMessage2.content}`);
  console.log(`Assistant: ${response2.content}\n`);

  // Show all history messages
  console.log("[History Message Record]");
  const allMessages = await history.getMessages();
  console.log(`Saved a total of ${allMessages.length} messages:`);
  allMessages.forEach((msg, index) => {
    const type = msg.type;
    const prefix = type === 'human' ? 'User' : 'Assistant';
    console.log(`  ${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`);
  });
}

inMemoryDemo().catch(console.error);