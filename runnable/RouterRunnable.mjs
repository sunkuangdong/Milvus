import 'dotenv/config';
import { RouterRunnable, RunnableLambda } from '@langchain/core/runnables';

// Create two simple RunnableLambda handlers.
const toUpperCase = RunnableLambda.from((text) => text.toUpperCase());
const reverseText = RunnableLambda.from((text) => text.split('').reverse().join(''));

// Create RouterRunnable and select runnable by key.
const router = new RouterRunnable({
  runnables: {
    toUpperCase,
    reverseText,
  },
});

// Test: call reverseText.
const result1 = await router.invoke({ key: 'reverseText', input: 'Hello World' });
console.log('reverseText result:', result1);

// Test: call toUpperCase.
const result2 = await router.invoke({ key: 'toUpperCase', input: 'Hello World' });
console.log('toUpperCase result:', result2);