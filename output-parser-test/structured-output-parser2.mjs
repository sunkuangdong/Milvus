import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Initialize model
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// Define complex output structure using zod
const scientistSchema = z.object({
    name: z.string().describe("科学家的全名"),
    birth_year: z.number().describe("出生年份"),
    death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
    nationality: z.string().describe("国籍"),
    fields: z.array(z.string()).describe("研究领域列表"),
    awards: z.array(
        z.object({
            name: z.string().describe("奖项名称"),
            year: z.number().describe("获奖年份"),
            reason: z.string().optional().describe("获奖原因")
        })
    ).describe("获得的重要奖项列表"),
    major_achievements: z.array(z.string()).describe("主要成就列表"),
    famous_theories: z.array(
        z.object({
            name: z.string().describe("理论名称"),
            year: z.number().optional().describe("提出年份"),
            description: z.string().describe("理论简要描述")
        })
    ).describe("著名理论列表"),
    education: z.object({
        university: z.string().describe("主要毕业院校"),
        degree: z.string().describe("学位"),
        graduation_year: z.number().optional().describe("毕业年份")
    }).optional().describe("教育背景"),
    biography: z.string().describe("简短传记，100字以内")
});

// Create parser from zod schema
const parser = StructuredOutputParser.fromZodSchema(scientistSchema);

const question = `请介绍一下居里夫人（Marie Curie）的详细信息，包括她的教育背景、研究领域、获得的奖项、主要成就和著名理论。

${parser.getFormatInstructions()}`;

console.log('📋 Generated prompt:\n');
console.log(question);

try {
    console.log("🤔 Calling language model (using Zod Schema)...\n");

    const response = await model.invoke(question);

    console.log("📤 Raw model response:\n");
    console.log(response.content);

    const result = await parser.parse(response.content);

    console.log("✅ Result automatically parsed and validated by StructuredOutputParser:\n");
    console.log(JSON.stringify(result, null, 2));

    console.log("📊 Formatted Display:\n");
    console.log(`👤 Name: ${result.name}`);
    console.log(`📅 Birth Year: ${result.birth_year}`);
    if (result.death_year) {
        console.log(`⚰️  Death Year: ${result.death_year}`);
    }
    console.log(`🌍 Nationality: ${result.nationality}`);
    console.log(`🔬 Research Fields: ${result.fields.join(', ')}`);

    console.log(`\n🎓 Education Background:`);
    if (result.education) {
        console.log(`   University: ${result.education.university}`);
        console.log(`   Degree: ${result.education.degree}`);
        if (result.education.graduation_year) {
            console.log(`   Graduation Year: ${result.education.graduation_year}`);
        }
    }

    console.log(`\n🏆 Awards (${result.awards.length}):`);
    result.awards.forEach((award, index) => {
        console.log(`   ${index + 1}. ${award.name} (${award.year})`);
        if (award.reason) {
            console.log(`      Reason: ${award.reason}`);
        }
    });

    console.log(`\n💡 Famous Theories (${result.famous_theories.length}):`);
    result.famous_theories.forEach((theory, index) => {
        console.log(`   ${index + 1}. ${theory.name}${theory.year ? ` (${theory.year})` : ''}`);
        console.log(`      ${theory.description}`);
    });

    console.log(`\n🌟 Major Achievements (${result.major_achievements.length}):`);
    result.major_achievements.forEach((achievement, index) => {
        console.log(`   ${index + 1}. ${achievement}`);
    });

    console.log(`\n📖 Biography:`);
    console.log(`   ${result.biography}`);

} catch (error) {
    console.error("❌ Error:", error.message);
    if (error.name === 'ZodError') {
        console.error("Validation Error Details:", error.errors);
    }
}