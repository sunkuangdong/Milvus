import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import path from "node:path";

const model = new ChatOpenAI({ 
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function fileHistoryDemo() {
  // Specify the path to store the file
  const filePath = path.join(process.cwd(), "chat_history.json");
  const sessionId = "user_session_001";

  // System prompt
  const systemMessage = new SystemMessage(
    "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
  );

  const restoredHistory = new FileSystemChatMessageHistory({
    filePath: filePath,
    sessionId: sessionId,
  });
  
  const restoredMessages = await restoredHistory.getMessages();
  console.log(`Restored ${restoredMessages.length} history messages from file:`);
  restoredMessages.forEach((msg, index) => {
    const type = msg.type;
    const prefix = type === 'human' ? 'User' : 'Assistant';
    console.log(`  ${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`);
  });
  console.log();

  console.log("[Third Round of Conversation]");
  const userMessage3 = new HumanMessage(
    "需要哪些食材？"
  );
  await restoredHistory.addMessage(userMessage3);
  
  const messages3 = [systemMessage, ...(await restoredHistory.getMessages())];
  const response3 = await model.invoke(messages3);
  await restoredHistory.addMessage(response3);
  
  console.log(`User: ${userMessage3.content}`);
  console.log(`Assistant: ${response3.content}`);
  console.log(`✓ Conversation saved to file\n`);
}

fileHistoryDemo().catch(console.error);