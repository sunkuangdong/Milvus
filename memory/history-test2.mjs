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
    "你是一个友好的做菜助手，喜欢分享美食和烹饪技巧。"
  );

  console.log("[First Round of Conversation]");
  const history = new FileSystemChatMessageHistory({
    filePath: filePath,
    sessionId: sessionId,
  });

  const userMessage1 = new HumanMessage(
    "红烧肉怎么做?"
  );
  await history.addMessage(userMessage1);
  
  const messages1 = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages1);
  await history.addMessage(response1);
  
  console.log(`User: ${userMessage1.content}`);
  console.log(`Assistant: ${response1.content}`);
  console.log(`✓ Conversation saved to file: ${filePath}\n`);

  console.log("[Second Round of Conversation]");
  const userMessage2 = new HumanMessage(
    "好吃吗？"
  );
  await history.addMessage(userMessage2);
  
  const messages2 = [systemMessage, ...(await history.getMessages())];
  const response2 = await model.invoke(messages2);
  await history.addMessage(response2);
  
  console.log(`User: ${userMessage2.content}`);
  console.log(`Assistant: ${response2.content}`);
  console.log(`✓ Conversation updated in file\n`);
}

fileHistoryDemo().catch(console.error);