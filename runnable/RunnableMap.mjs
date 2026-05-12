import 'dotenv/config';
import { RunnableMap, RunnableLambda } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';

const addOne = RunnableLambda.from((input) => input.num + 1);
const multiplyTwo = RunnableLambda.from((input) => input.num * 2);
const square = RunnableLambda.from((input) => input.num * input.num);

const greetTemplate = PromptTemplate.fromTemplate('Hello, {name}!');
const weatherTemplate = PromptTemplate.fromTemplate("Today's weather is {weather}.");

// Create RunnableMap to execute multiple runnables in parallel.
const runnableMap = RunnableMap.from({
  // Math operations.
  add: addOne,
  multiply: multiplyTwo,
  square: square,

  // Prompt formatting.
  greeting: greetTemplate,
  weather: weatherTemplate,
});

// Test input.
const input = {
  name: 'Shenguang',
  weather: 'cloudy',
  num: 5,
};

// Execute RunnableMap.
const result = await runnableMap.invoke(input);
console.log(result);