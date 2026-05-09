import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools';
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

// 1) Bind tool and attach parser
const parser = new JsonOutputToolsParser();
const chain = modelWithTool.pipe(parser);


try {
    // 2) Start streaming
    const stream = await chain.stream("详细介绍牛顿的生平和成就");

    let lastContent = ""; // Track full content printed so far
    let finalResult = null; // Store final complete result

    console.log("📡 Real-time streaming output:\n");
    

    for await (const chunk of stream) {
        if (chunk.length > 0) {
            const toolCall = chunk[0];
            console.log('raw chunk:', chunk);

            // Get current full tool-call argument content
            // const currentContent = JSON.stringify(toolCall.args || {}, null, 2);

            // if (currentContent.length > lastContent.length) {
            //     const newText = currentContent.slice(lastContent.length);
            //     process.stdout.write(newText); // Print to console in real time
            //     lastContent = currentContent; // Update progress
            // }

            if (toolCall.args && Object.keys(toolCall.args).length > 0) {
                console.log(toolCall.args);
            }
        }
    }

    console.log("\n\n✅ Streaming output complete");

} catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
}