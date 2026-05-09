import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// Define structured output schema
const scientistSchema = z.object({
    name: z.string().describe("科学家的全名"),
    birth_year: z.number().describe("出生年份"),
    nationality: z.string().describe("国籍"),
    fields: z.array(z.string()).describe("研究领域列表"),
});

const modelWithTool = model.bindTools([
    {
        name: "extract_scientist_info",
        description: "提取和结构化科学家的详细信息",
        schema: scientistSchema
    }
]);

// Call the model
const response = await modelWithTool.invoke("介绍一下爱因斯坦");

console.log('response.tool_calls:', response.tool_calls);
// Get the structured result
const result = response.tool_calls[0].args;

console.log("Structured Result:", JSON.stringify(result, null, 2));
console.log(`\nName: ${result.name}`);
console.log(`Birth Year: ${result.birth_year}`);
console.log(`Nationality: ${result.nationality}`);
console.log(`Fields of Study: ${result.fields.join(', ')}`);