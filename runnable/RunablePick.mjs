import 'dotenv/config';
import { RunnablePick, RunnableSequence } from '@langchain/core/runnables';

const inputData = {
  name: 'Shenguang',
  age: 30,
  city: 'Beijing',
  country: 'China',
  email: 'shenguang@example.com',
  phone: '+86-13800138000',
};

const chain = RunnableSequence.from([
  (input) => ({
    ...input,
    fullInfo: `${input.name}, ${input.age} years old, from ${input.city}`,
  }),
  new RunnablePick(['name', 'fullInfo']),
]);

const result = await chain.invoke(inputData);
console.log(result);