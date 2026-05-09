import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';

// Initialize the model
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

const parser = new JsonOutputParser();

const question = `请介绍一下爱因斯坦的信息。请以 JSON 格式返回，包含以下字段：name（姓名）、birth_year（出生年份）、nationality（国籍）、major_achievements（主要成就，数组）、famous_theory（著名理论）。

${parser.getFormatInstructions()}`;

console.log('question:', question);
try {
    console.log("🤔 Calling the large language model (using JsonOutputParser)...\n");

    const response = await model.invoke(question);

    console.log("📤 Model raw response:\n");
    console.log(response.content);

    const result = await parser.parse(response.content);

    console.log("✅ Result automatically parsed by JsonOutputParser:\n");
    console.log(result);
    console.log(`Name: ${result.name}`);
    console.log(`Birth Year: ${result.birth_year}`);
    console.log(`Nationality: ${result.nationality}`);
    console.log(`Famous Theory: ${result.famous_theory}`);
    console.log(`Major Achievements:`, result.major_achievements);

} catch (error) {
    console.error("❌ Error:", error.message);
}