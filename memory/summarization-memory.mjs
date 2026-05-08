import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, SystemMessage, AIMessage, getBufferString } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
  },
});

// ========== Summarization Strategy Demo ==========
async function summarizationMemoryDemo() {
  const history = new InMemoryChatMessageHistory();
  const maxMessages = 6; // Trigger summarization when exceeding 6 messages

  const messages = [
    { type: 'human', content: '我想学做红烧肉，你能教我吗？' },
    { type: 'ai', content: '当然可以！红烧肉是一道经典的中式菜肴。首先需要准备五花肉、冰糖、生抽、老抽、料酒等材料。' },
    { type: 'human', content: '五花肉需要切多大块？' },
    { type: 'ai', content: '建议切成3-4厘米见方的块，这样既容易入味，口感也更好。切好后可以用开水焯一下去除血沫。' },
    { type: 'human', content: '炒糖色的时候有什么技巧吗？' },
    { type: 'ai', content: '炒糖色是关键步骤。用小火慢慢炒，等冰糖完全融化变成焦糖色，冒小泡时就可以下肉了。注意不要炒过头，否则会发苦。' },
    { type: 'human', content: '需要炖多长时间？' },
    { type: 'ai', content: '一般需要炖40-60分钟，用小火慢炖，直到肉变得软糯入味。可以用筷子戳一下，能轻松戳透就说明好了。' },
    { type: 'human', content: '最后收汁的时候要注意什么？' },
    { type: 'ai', content: '收汁时要用大火，不断翻动，让汤汁均匀包裹在肉块上。看到汤汁变得浓稠，颜色红亮就可以出锅了。' },
  ];

  // Add all messages
  for (const msg of messages) {
    if (msg.type === 'human') {
      await history.addMessage(new HumanMessage(msg.content));
    } else {
      await history.addMessage(new AIMessage(msg.content));
    }
  }

  let allMessages = await history.getMessages();
  
  console.log(`Original message count: ${allMessages.length}`);
  console.log("Original messages:\n  " + allMessages.map(m => `${m.constructor.name}: ${m.content}`).join('\n  '));
  
  // Trigger summarization if too many messages
  if (allMessages.length >= maxMessages) {
    const keepRecent = 2; // Keep the 2 most recent messages
    
    // Separate messages to keep and messages to summarize
    const recentMessages = allMessages.slice(-keepRecent);
    const messagesToSummarize = allMessages.slice(0, -keepRecent);
    
    console.log("\n💡 History is too long, starting summarization...");
    console.log(`📝 Number of messages to be summarized: ${messagesToSummarize.length}`);
    console.log(`📝 Number of messages to be retained: ${recentMessages.length}`);
    
    // Summarize the old messages that will be discarded
    const summary = await summarizeHistory(messagesToSummarize);
    
    // Clear history and only keep recent messages
    await history.clear();
    
    // Add the summary as a SystemMessage first
    await history.addMessage(new SystemMessage(`Previous conversation summary: ${summary}`));
    
    // Then add the recent messages
    for (const msg of recentMessages) {
      await history.addMessage(msg);
    }
    
    console.log(`\nRetained message count: ${recentMessages.length}`);
    console.log("Retained messages:\n  " + recentMessages.map(m => `${m.constructor.name}: ${m.content}`).join('\n  '));
    console.log(`\nSummary content (excluding retained messages): ${summary}`);
  } else {
    console.log("\nMessage count does not exceed threshold, no summarization needed");
  }
}

summarizationMemoryDemo().catch(console.error);

// Function to summarize conversation history
async function summarizeHistory(messages) {
  if (messages.length === 0) return "";
  
  const conversationText = getBufferString(messages, {
    humanPrefix: "User",
    aiPrefix: "Assistant",
  });
  
  const summaryPrompt = `Please summarize the core content of the following conversation,
                        keeping the important information:
                        ${conversationText}
                        Summary:`;
  
  const summaryResponse = await model.invoke([new SystemMessage(summaryPrompt)]);
  return summaryResponse.content;
}