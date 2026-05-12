import 'dotenv/config';
import { RunnablePassthrough, RunnableLambda, RunnableSequence, RunnableMap } from '@langchain/core/runnables';

// const chain = RunnableSequence.from([
//   RunnableLambda.from((input) => ({ concept: input })),
//   RunnableMap.from({
//     original: new RunnablePassthrough(),
//     processed: RunnableLambda.from((obj) => ({
//       concept: obj.concept,
//       upper: obj.concept.toUpperCase(),
//       length: obj.concept.length,
//     })),
//   }),
// ]);

const chain = RunnableSequence.from([
  (input) => ({ concept: input }),
  RunnablePassthrough.assign({
    original: new RunnablePassthrough(),
    processed: (obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  }),
]);

const input = 'Let there be light';
const result = await chain.invoke(input);
console.log(result);