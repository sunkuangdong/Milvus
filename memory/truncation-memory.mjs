import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, trimMessages } from "@langchain/core/messages";
import { getEncoding } from "js-tiktoken";

// ========== 1. Truncate by message count ==========
async function messageCountTruncation() {
  const history = new InMemoryChatMessageHistory();
  const maxMessages = 4;

  const messages = [
    { type: 'human', content: 'My name is John.' },
    { type: 'ai', content: 'Hello John, nice to meet you!' },
    { type: 'human', content: 'I am 25 years old.' },
    { type: 'ai', content: '25 is a great age, how can I help you?' },
    { type: 'human', content: 'I love programming.' },
    { type: 'ai', content: 'Programming is fun! What languages do you use?' },
    { type: 'human', content: 'I live in Beijing.' },
    { type: 'ai', content: 'Beijing is an amazing city!' },
    { type: 'human', content: 'I am a software engineer.' },
    { type: 'ai', content: 'Software engineering is a very promising career!' },
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
  
  // Truncate by count: keep only the most recent maxMessages
  const trimmedMessages = allMessages.slice(-maxMessages);

  console.log(`Retained message count: ${trimmedMessages.length}`);
  console.log("Retained messages:\n  " + trimmedMessages.map(m => `${m.constructor.name}: ${m.content}`).join('\n  '));
}


// Calculate total tokens for an array of messages
function countTokens(messages, encoder) {
  let total = 0;
  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    total += encoder.encode(content).length;
  }
  return total;
}

// ========== 2. Truncate by token count (using js-tiktoken) ==========
async function tokenCountTruncation() {
  const history = new InMemoryChatMessageHistory();
  const maxTokens = 100; // Limit to maximum 100 tokens
  
  const enc = getEncoding("cl100k_base");

  const messages = [
    { type: 'human', content: 'My name is Alice.' },
    { type: 'ai', content: 'Hello Alice, nice to meet you!' },
    { type: 'human', content: 'I am a designer.' },
    { type: 'ai', content: 'Design is a very creative career! What kind of design do you do?' },
    { type: 'human', content: 'I like art and music.' },
    { type: 'ai', content: 'Art and music are great hobbies, they can inspire creativity.' },
    { type: 'human', content: 'I specialize in UI/UX design.' },
    { type: 'ai', content: 'UI/UX design is very important, good user experience makes products successful!' },
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
  
  // Use trimMessages API: calculate token count with js-tiktoken
  const trimmedMessages = await trimMessages(allMessages, {
    maxTokens: maxTokens,
    tokenCounter: async (msgs) => countTokens(msgs, enc),
    strategy: "last", // Keep recent messages
  });
  
  // Calculate actual token count for display
  const totalTokens = countTokens(trimmedMessages, enc);
  
  console.log(`\nTotal token count: ${totalTokens}/${maxTokens}`);
  console.log(`Retained message count: ${trimmedMessages.length}`);
  console.log("Retained messages:\n  " + trimmedMessages.map(m => {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    const tokens = enc.encode(content).length;
    return `${m.constructor.name} (${tokens} tokens): ${content}`;
  }).join('\n  '));
  
}

async function runAll() {
  console.log("--- 1. Message Count Truncation ---");
  await messageCountTruncation();
  console.log("\n--- 2. Token Count Truncation ---");
  await tokenCountTruncation();
}

runAll().catch(console.error);