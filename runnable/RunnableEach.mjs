import 'dotenv/config';
import { RunnableEach, RunnableLambda, RunnableSequence } from '@langchain/core/runnables';

const toUpperCase = RunnableLambda.from((input) => input.toUpperCase());
const addGreeting = RunnableLambda.from((input) => `Hello, ${input}!`);

const processItem = RunnableSequence.from([
  toUpperCase,
  addGreeting,
]);

// Apply the chain to each element in the input array.
const chain = new RunnableEach({
  bound: processItem,
});

const input = ['alice', 'bob', 'carol'];
const result = await chain.invoke(input);

console.log('✅ RunnableEach - array element processing:');
console.log('Input:', input);
console.log('Output:', result);