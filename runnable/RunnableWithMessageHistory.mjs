import 'dotenv/config';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME ?? 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.3,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.chatanywhere.tech/v1',
  },
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a concise and helpful assistant. Answer user questions in 1-2 sentences with clear, useful information.',
  ],
  new MessagesPlaceholder('history'),
  ['human', '{question}'],
]);

const simpleChain = prompt.pipe(model).pipe(new StringOutputParser());

const messageHistories = new Map();

const getMessageHistory = (sessionId) => {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  return messageHistories.get(sessionId);
};

// Create chain with message history support.
const chain = new RunnableWithMessageHistory({
  runnable: simpleChain,
  getMessageHistory: (sessionId) => getMessageHistory(sessionId),
  inputMessagesKey: 'question',
  historyMessagesKey: 'history',
});

// Test: first turn (provide profile info).
console.log('--- Turn 1 (provide information) ---');
const result1 = await chain.invoke(
  {
    question: 'My name is Shenguang, I am from Shandong, and I like coding, writing, and Teamfight Tactics.',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('Question: My name is Shenguang, I am from Shandong, and I like coding, writing, and Teamfight Tactics.');
console.log('Answer:', result1);
console.log();

// Test: second turn (ask about previous info).
console.log('--- Turn 2 (ask previous information) ---');
const result2 = await chain.invoke(
  {
    question: 'Where did I say I am from?',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('Question: Where did I say I am from?');
console.log('Answer:', result2);
console.log();

// Test: third turn (continue asking).
console.log('--- Turn 3 (continue asking) ---');
const result3 = await chain.invoke(
  {
    question: 'What are my hobbies?',
  },
  {
    configurable: {
      sessionId: 'user-123',
    },
  },
);
console.log('Question: What are my hobbies?');
console.log('Answer:', result3);
console.log();