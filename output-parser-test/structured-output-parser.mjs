import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

// Initialize the model
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// Define output structure
const parser = StructuredOutputParser.fromNamesAndDescriptions({
    name: "姓名",
    birth_year: "出生年份",
    nationality: "国籍",
    major_achievements: "主要成就，用逗号分隔的字符串",
    famous_theory: "著名理论"
});

const question = `请介绍一下爱因斯坦的信息。

${parser.getFormatInstructions()}`;

console.log('question:', question)

try {
    console.log("🤔 Calling the large language model (using StructuredOutputParser)...\n");

    const response = await model.invoke(question);

    console.log("📤 Model raw response:\n");
    console.log(response.content);

    const result = await parser.parse(response.content);

    console.log("\n✅ Result automatically parsed by StructuredOutputParser:\n");
    console.log(result);
    console.log(`Name: ${result.name}`);
    console.log(`Birth Year: ${result.birth_year}`);
    console.log(`Nationality: ${result.nationality}`);
    console.log(`Famous Theory: ${result.famous_theory}`);
    console.log(`Major Achievements: ${result.major_achievements}`);

} catch (error) {
    console.error("❌ Error:", error.message);
}