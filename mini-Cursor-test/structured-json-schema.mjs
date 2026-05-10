import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const scientistSchema = z.object({
    name: z.string().describe("科学家的全名"),
    birth_year: z.number().describe("出生年份"),
    field: z.string().describe("主要研究领域"),
    achievements: z.array(z.string()).describe("主要成就列表")
}).strict();

// Convert Zod schema to native JSON Schema
// const nativeJsonSchema = zodToJsonSchema(scientistSchema);
const nativeJsonSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
            name: { type: "string", description: "科学家的全名" },
            birth_year: { type: "number", description: "出生年份" },
            field: { type: "string", description: "主要研究领域" },
            achievements: {
            type: "array",
            items: { type: "string" },
            description: "主要成就列表"
        }
    },
    required: ["name", "birth_year", "field", "achievements"]
};

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
    modelKwargs: { // Pass native parameters through modelKwargs
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "scientist_info",
                strict: true,
                schema: nativeJsonSchema // Converted native JSON schema object
            }
        }
    }
});

async function testNativeJsonSchema() {
    console.log(chalk.bgMagenta("🧪 Testing native JSON Schema mode...\n"));

    const res = await model.invoke([
        new SystemMessage("你是一个信息提取助手，请直接返回 JSON 数据。"),
        new HumanMessage("介绍一下杨振宁")
    ]);

    console.log(chalk.green("\n✅ Received response (pure JSON):"));
    console.log(res.content);

    const data = JSON.parse(res.content);
    console.log(chalk.cyan("\n📋 Parsed object:"));
    console.log(data);
}

testNativeJsonSchema().catch(console.error);