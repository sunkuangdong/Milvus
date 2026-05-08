import "dotenv/config";
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = 'ebook_collection';
const VECTOR_DIM = 768; // Updated to 768 for nomic-embed-text

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OLLAMA_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration: {
        baseURL: process.env.OLLAMA_BASE_URL
    },
    dimensions: VECTOR_DIM
});

const client = new MilvusClient({
    address: 'localhost:19530'
});

async function getEmbedding(text) {
    const result = await embeddings.embedQuery(text);
    return result;
}

async function main() {
    try {
        console.log('Connecting to Milvus...');
        await client.connectPromise;
        console.log('✓ Connected\n');

        // Ensure collection is loaded
        try {
            await client.loadCollection({ collection_name: COLLECTION_NAME });
            console.log('✓ Collection loaded\n');
        } catch (error) {
            // Ignore error if already loaded
            if (!error.message.includes('already loaded')) {
                throw error;
            }
            console.log('✓ Collection is already loaded\n');
        }

        // Vector search
        console.log('Searching for similar ebook content...');
        const query = '段誉会什么武功？';
        console.log(`Query: "${query}"\n`);

        const queryVector = await getEmbedding(query);
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit: 3,
            metric_type: MetricType.COSINE,
            output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content']
        });

        console.log(`Found ${searchResult.results.length} results:\n`);
        searchResult.results.forEach((item, index) => {
            console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
            console.log(`   ID: ${item.id}`);
            console.log(`   Book ID: ${item.book_id}`);
            console.log(`   Chapter: Chapter ${item.chapter_num}`);
            console.log(`   Index: ${item.index}`);
            console.log(`   Content: ${item.content}\n`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();