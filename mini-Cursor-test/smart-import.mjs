import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import mysql from 'mysql2/promise';

// Initialize model
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// Define zod schema for a single friend, aligned with the friends table structure
const friendSchema = z.object({
  name: z.string().describe('姓名'),
  gender: z.string().describe('性别（男/女）'),
  birth_date: z.string().describe('出生日期，格式：YYYY-MM-DD，如果无法确定具体日期，根据年龄估算'),
  company: z.string().nullable().describe('公司名称，如果没有则返回 null'),
  title: z.string().nullable().describe('职位/头衔，如果没有则返回 null'),
  phone: z.string().nullable().describe('手机号，如果没有则返回 null'),
  wechat: z.string().nullable().describe('微信号，如果没有则返回 null'),
});

// OpenAI structured output requires top-level object
const extractionSchema = z.object({
  friends: z.array(friendSchema).describe('好友信息数组'),
});

// Use withStructuredOutput
const structuredModel = model.withStructuredOutput(extractionSchema);

// Database connection config
const connectionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  multipleStatements: true,
};

async function extractAndInsert(text) {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    // Switch to hello database
    await connection.query(`USE hello;`);

    // Extract structured information with AI
    console.log('🤔 Extracting information from text...\n');
    const prompt = `请从以下文本中提取所有好友信息，文本中可能包含一个或多个人的信息。请将每个人的信息分别提取出来。

                    ${text}

                    要求：
                    1. 如果文本中包含多个人，请为每个人创建一个对象
                    2. 每个对象包含以下字段：
                    - 姓名：提取文本中的人名
                    - 性别：提取性别信息（男/女）
                    - 出生日期：如果能找到具体日期最好，否则根据年龄描述估算（格式：YYYY-MM-DD）
                    - 公司：提取公司名称
                    - 职位：提取职位/头衔信息
                    - 手机号：提取手机号码
                    - 微信号：提取微信号
                    3. 如果某个字段在文本中找不到，请返回 null
                    4. 返回对象格式：{ "friends": [ ... ] }`;

    const extraction = await structuredModel.invoke(prompt);
    const results = extraction.friends ?? [];

    console.log(`✅ Extracted ${results.length} structured records:`);
    console.log(JSON.stringify(results, null, 2));
    console.log('');

    if (results.length === 0) {
      console.log('⚠️ No information extracted');
      return { count: 0, insertIds: [] };
    }

    // Batch insert into database
    const insertSql = `
      INSERT INTO friends (
        name,
        gender,
        birth_date,
        company,
        title,
        phone,
        wechat
      ) VALUES ?;
    `;

    const values = results.map((result) => [
      result.name,
      result.gender,
      result.birth_date || null,
      result.company,
      result.title,
      result.phone,
      result.wechat,
    ]);

    const [insertResult] = await connection.query(insertSql, [values]);
    console.log(`✅ Successfully inserted ${insertResult.affectedRows} records in batch`);
    console.log(`   Inserted ID range: ${insertResult.insertId} - ${insertResult.insertId + insertResult.affectedRows - 1}`);

    return {
      count: insertResult.affectedRows,
      insertIds: Array.from({ length: insertResult.affectedRows }, (_, i) => insertResult.insertId + i),
    };
  } catch (err) {
    console.error('❌ Execution error:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Main function
async function main() {
  // Sample text (contains multiple people)
  const sampleText = `我最近认识了几个新朋友。第一个是张总，女的，看起来30出头，在腾讯做技术总监，手机13800138000，微信是zhangzong2024。第二个是李工，男，大概28岁，在阿里云做架构师，电话15900159000，微信号lee_arch。还有一个是陈经理，女，35岁左右，在美团做产品经理，手机号是18800188000，微信chenpm2024。`;

  console.log('📝 Input text:');
  console.log(sampleText);
  console.log('');

  try {
    const result = await extractAndInsert(sampleText);
    console.log(`\n🎉 Done! Successfully inserted ${result.count} records`);
    console.log(`   Inserted IDs: ${result.insertIds.join(', ')}`);
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    process.exit(1);
  }
}

main();