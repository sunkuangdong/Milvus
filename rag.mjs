import "dotenv/config";
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = 'ai_diary';
const VECTOR_DIM = 1024;

// Initialize OpenAI Chat model
const model = new ChatOpenAI({
    temperature: 0.7,
    model: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// Initialize Embeddings model
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL
    },
    dimensions: VECTOR_DIM
});

// Initialize Milvus client
const client = new MilvusClient({
    address: 'localhost:19530'
});

/**
 * Get vector embedding for text
 */
async function getEmbedding(text) {
    const result = await embeddings.embedQuery(text);
    return result;
}

/**
 * Retrieve relevant diary entries from Milvus
 */
async function retrieveRelevantDiaries(question, k = 2) {
    try {
        // Generate vector for the question
        const queryVector = await getEmbedding(question);

        // Search for similar diaries in Milvus
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit: k,
            metric_type: MetricType.COSINE,
            output_fields: ['id', 'content', 'date', 'mood', 'tags']
        });

        return searchResult.results;
    } catch (error) {
        console.error('Error retrieving diaries:', error.message);
        return [];
    }
}

/**
 * Use RAG to answer questions about the diaries
 */
async function answerDiaryQuestion(question, k = 2) {
    try {
        console.log('='.repeat(80));
        console.log(`Question: ${question}`);
        console.log('='.repeat(80));

        // 1. Retrieve relevant diaries
        console.log('\n[Retrieving relevant diaries]');
        const retrievedDiaries = await retrieveRelevantDiaries(question, k);

        if (retrievedDiaries.length === 0) {
            console.log('No relevant diaries found');
            return 'Sorry, I could not find any relevant diary entries.';
        }

        // 2. Print retrieved diaries and similarities
        retrievedDiaries.forEach((diary, i) => {
            console.log(`\n[Diary ${i + 1}] Similarity: ${diary.score.toFixed(4)}`);
            console.log(`Date: ${diary.date}`);
            console.log(`Mood: ${diary.mood}`);
            console.log(`Tags: ${diary.tags?.join(', ')}`);
            console.log(`Content: ${diary.content}`);
        });

        // 3. Build context
        const context = retrievedDiaries
            .map((diary, i) => {
                return `[Diary ${i + 1}]
Date: ${diary.date}
Mood: ${diary.mood}
Tags: ${diary.tags?.join(', ')}
Content: ${diary.content}`;
            })
            .join('\n\n━━━━━\n\n');

        // 4. Build prompt
        const prompt = `You are a warm and caring AI diary assistant. Answer questions based on the user's diary entries using friendly and natural language.

Please answer the question based on the following diary content:
${context}

User question: ${question}

Requirements for the answer:
1. If the diary contains relevant information, provide a detailed and warm answer combined with the diary content.
2. You can summarize the content of multiple diaries to find commonalities or trends.
3. If there is no relevant information in the diary, gently inform the user.
4. Use the first-person "you" to address the author of the diary.
5. The answer should be empathetic, making the user feel understood and cared for.

AI Assistant's answer:`;

        // 5. Call LLM to generate the answer
        console.log('\n[AI Answer]');
        const response = await model.invoke(prompt);
        console.log(response.content);
        console.log('\n');

        return response.content;
    } catch (error) {
        console.error('Error answering question:', error.message);
        return 'Sorry, an error occurred while processing your question.';
    }
}

async function main() {
    try {
        console.log('Connecting to Milvus...');
        await client.connectPromise;
        console.log('✓ Connected\n');

        await answerDiaryQuestion("What have I done recently that made me happy?", 2);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();