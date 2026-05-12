import 'dotenv/config';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME ?? 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.chatanywhere.tech/v1',
  },
});

// Define output schema.
const schema = z.object({
  translation: z.string().describe('Translated English text'),
  keywords: z.array(z.string()).length(3).describe('Three keywords'),
});

const outputParser = StructuredOutputParser.fromZodSchema(schema);

const promptTemplate = PromptTemplate.fromTemplate(
  '将以下文本翻译成英文，然后总结为3个关键词。\n\n文本：{text}\n\n{format_instructions}',
);

const input = {
  text: 'LangChain 是一个强大的 AI 应用开发框架',
  format_instructions: outputParser.getFormatInstructions(),
};

// Step 1: format prompt.
const formattedPrompt = await promptTemplate.format(input);
// Step 2: invoke model.
const response = await model.invoke(formattedPrompt);
// Step 3: parse output.
const result = await outputParser.invoke(response);
console.log('✅ Final result:');
console.log(result);