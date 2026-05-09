import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// Define structured output format with zod
const schema = z.object({
    name: z.string().describe("姓名"),
    birth_year: z.number().describe("出生年份"),
    death_year: z.number().describe("去世年份"),
    nationality: z.string().describe("国籍"),
    occupation: z.string().describe("职业"),
    famous_works: z.array(z.string()).describe("著名作品列表"),
    biography: z.string().describe("简短传记")
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const prompt = `详细介绍莫扎特的信息。\n\n${parser.getFormatInstructions()}`;

console.log("🌊 Structured streaming output demo\n");

try {
    const stream = await model.stream(prompt);

    let fullContent = '';
    let chunkCount = 0;

    console.log("📡 Receiving streaming data:\n");

    for await (const chunk of stream) {
        chunkCount++;
        const content = chunk.content;
        fullContent += content;

        process.stdout.write(content); // Display streaming text in real time
    }

    console.log(`\n\n✅ Received ${chunkCount} chunks in total\n`);

    // Parse full content into structured data
    const result = await parser.parse(fullContent);

    console.log("📊 Parsed structured result:\n");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n📝 Formatted output:");
    console.log(`Name: ${result.name}`);
    console.log(`Birth Year: ${result.birth_year}`);
    console.log(`Death Year: ${result.death_year}`);
    console.log(`Nationality: ${result.nationality}`);
    console.log(`Occupation: ${result.occupation}`);
    console.log(`Famous Works: ${result.famous_works.join(', ')}`);
    console.log(`Biography: ${result.biography}`);

} catch (error) {
    console.error("\n❌ Error:", error.message);
}