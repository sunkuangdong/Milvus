import "dotenv/config";
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = 'ebook_collection';
const VECTOR_DIM = 768; // Updated to match nomic-embed-text dimensions

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
    apiKey: process.env.OLLAMA_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration: {
        baseURL: process.env.OLLAMA_BASE_URL
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
 * Retrieve relevant ebook content from Milvus
 */
async function retrieveRelevantContent(question, k = 3) {
    try {
        // Generate query vector
        const queryVector = await getEmbedding(question);

        // Search for similar content in Milvus
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit: k,
            metric_type: MetricType.COSINE,
            output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content']
        });

        return searchResult.results;
    } catch (error) {
        console.error('Error retrieving content:', error.message);
        return [];
    }
}

/**
 * Use RAG to answer questions about the ebook
 */
async function answerEbookQuestion(question, k = 3) {
    try {
        console.log('='.repeat(80));
        console.log(`Question: ${question}`);
        console.log('='.repeat(80));

        // 1. Retrieve relevant content
        console.log('\n[Retrieving relevant content]');
        const retrievedContent = await retrieveRelevantContent(question, k);

        if (retrievedContent.length === 0) {
            console.log('No relevant content found');
            return 'Sorry, I could not find relevant content from the ebook.';
        }

        // 2. Print retrieved content and similarities
        retrievedContent.forEach((item, i) => {
            console.log(`\n[Fragment ${i + 1}] Similarity: ${item.score.toFixed(4)}`);
            console.log(`Book ID: ${item.book_id}`);
            console.log(`Chapter: Chapter ${item.chapter_num}`);
            console.log(`Index: ${item.index}`);
            console.log(`Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}`);
        });

        // 3. Build context
        const context = retrievedContent
            .map((item, i) => {
                return `[Fragment ${i + 1}]
                        Chapter: Chapter ${item.chapter_num}
                        Content: ${item.content}`;
            })
            .join('\n\n━━━━━\n\n');

        // 4. Build prompt
        const prompt = `You are a professional assistant for the novel "Demi-Gods and Semi-Devils" (天龙八部). Answer questions based on the novel content using accurate and detailed language.

                        Please answer the question based on the following novel fragments:
                        ${context}

                        User question: ${question}

                        Requirements:
                        1. If there is relevant information in the fragments, provide a detailed and accurate answer combined with the novel content.
                        2. You can synthesize information from multiple fragments to provide a complete answer.
                        3. If there is no relevant information in the fragments, truthfully inform the user.
                        4. The answer must be accurate and align with the novel's plot and character settings.
                        5. You may quote the original text to support your answer.

                        AI Assistant's answer:`;

        // 5. Call LLM to generate answer
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

        // Ask a question about the ebook
        await answerEbookQuestion("鸠摩智会什么武功？", 5);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();