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

// Define schema for structured output
const scientistSchema = z.object({
    name: z.string().describe("科学家的全名"),
    birth_year: z.number().describe("出生年份"),
    death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
    nationality: z.string().describe("国籍"),
    fields: z.array(z.string()).describe("研究领域列表"),
    achievements: z.array(z.string()).describe("主要成就"),
    biography: z.string().describe("简短传记")
});

// Bind tool to model
const modelWithTool = model.bindTools([
    {
        name: "extract_scientist_info",
        description: "提取和结构化科学家的详细信息",
        schema: scientistSchema
    }
]);

console.log("🌊 Streaming Tool Calls Demo - print raw tool_calls_chunk directly\n");

try {
    // Start streaming output
    const stream = await modelWithTool.stream("详细介绍牛顿的生平和成就");

    console.log("📡 Real-time streaming tool_calls_chunk output:\n");

    let chunkIndex = 0;

    for await (const chunk of stream) {
        console.log('chunk:', chunk);
        chunkIndex++;
        // Print tool_calls info from each chunk directly
        if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
            process.stdout.write(chunk.tool_call_chunks[0].args);
        }
    }

    console.log("\n\n✅ Streaming output completed");

} catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
}