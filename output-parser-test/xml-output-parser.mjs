import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { XMLOutputParser } from '@langchain/core/output_parsers';

// Initialize the model
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

const parser = new XMLOutputParser();

const question = `请提取以下文本中的人物信息：阿尔伯特·爱因斯坦出生于 1879 年，是一位伟大的物理学家。

${parser.getFormatInstructions()}`;

console.log('question:', question);

try {
    console.log("🤔 Calling the large language model (using XMLOutputParser)...\n");

    const response = await model.invoke(question);

    console.log("📤 Raw model response:\n");
    console.log(response.content);

    const result = await parser.parse(response.content);

    console.log("\n✅ Result automatically parsed by XMLOutputParser:\n");
    console.log(result);

} catch (error) {
    console.error("❌ Error:", error.message);
}