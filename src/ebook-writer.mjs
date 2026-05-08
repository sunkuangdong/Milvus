import "dotenv/config";
import { parse } from 'path';
import { MilvusClient, DataType, MetricType, IndexType } from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from "@langchain/openai";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const COLLECTION_NAME = 'ebook_collection';
const VECTOR_DIM = 768;
const CHUNK_SIZE = 500; // Split into 500 characters
const EPUB_FILE = './src/天龙八部.epub';

// Extract book name from file name (remove extension)
const BOOK_NAME = parse(EPUB_FILE).name;

// Initialize Embeddings model
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OLLAMA_API_KEY, // This will be the fake key from .env
    model: process.env.EMBEDDINGS_MODEL_NAME, // This will be nomic-embed-text
    configuration: {
        baseURL: process.env.OLLAMA_BASE_URL // This will be http://localhost:11434/v1
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
 * Create or get collection
 */
async function ensureCollection(bookId) {
    try {
        // Check if collection exists
        const hasCollection = await client.hasCollection({
            collection_name: COLLECTION_NAME
        });

        if (!hasCollection.value) {
            console.log('Creating collection...');
            await client.createCollection({
                collection_name: COLLECTION_NAME,
                fields: [
                    { name: 'id', data_type: DataType.VarChar, max_length: 100, is_primary_key: true },
                    { name: 'book_id', data_type: DataType.VarChar, max_length: 100 },
                    { name: 'book_name', data_type: DataType.VarChar, max_length: 200 },
                    { name: 'chapter_num', data_type: DataType.Int32 },
                    { name: 'index', data_type: DataType.Int32 },
                    { name: 'content', data_type: DataType.VarChar, max_length: 10000 },
                    { name: 'vector', data_type: DataType.FloatVector, dim: VECTOR_DIM }
                ]
            });
            console.log('✓ Collection created successfully');

            // Create index
            console.log('Creating index...');
            await client.createIndex({
                collection_name: COLLECTION_NAME,
                field_name: 'vector',
                index_type: IndexType.IVF_FLAT,
                metric_type: MetricType.COSINE,
                params: { nlist: 1024 }
            });
            console.log('✓ Index created successfully');
        }

        // Ensure collection is loaded
        try {
            await client.loadCollection({ collection_name: COLLECTION_NAME });
            console.log('✓ Collection loaded');
        } catch (error) {
            console.log('✓ Collection is already loaded');
        }

    } catch (error) {
        console.error('Error creating collection:', error.message);
        throw error;
    }
}

/**
 * Insert document chunks into Milvus in batches (streaming processing)
 */
async function insertChunksBatch(chunks, bookId, chapterNum) {
    try {
        if (chunks.length === 0) {
            return 0;
        }

        // Generate vectors for each document chunk and build insert data
        const insertData = await Promise.all(
            chunks.map(async (chunk, chunkIndex) => {
                const vector = await getEmbedding(chunk);
                // Manually generate ID: bookId_chapterNum_index
                return {
                    id: `${bookId}_${chapterNum}_${chunkIndex}`,
                    book_id: String(bookId),
                    book_name: BOOK_NAME,
                    chapter_num: chapterNum,
                    index: chunkIndex,
                    content: chunk,
                    vector: vector
                };
            })
        );

        // Batch insert into Milvus
        const insertResult = await client.insert({
            collection_name: COLLECTION_NAME,
            data: insertData
        });

        return Number(insertResult.insert_cnt) || 0;
    } catch (error) {
        console.error(`Error inserting data for chapter ${chapterNum}:`, error.message);
        console.error('Error details:', error);
        throw error;
    }
}

/**
 * Load EPUB file and process it streaming (process and insert simultaneously)
 */
async function loadAndProcessEPubStreaming(bookId) {
    try {
        console.log(`\nStarting to load EPUB file: ${EPUB_FILE}`);

        // Use EPubLoader to load the file, split by chapters
        const loader = new EPubLoader(
            EPUB_FILE,
            {
                splitChapters: true,
            }
        );

        const documents = await loader.load();
        console.log(`✓ Loading complete, total ${documents.length} chapters\n`);

        // Create text splitter, split to 500 characters
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: 50, // Overlap 50 characters to maintain context continuity
        });

        let totalInserted = 0;

        // Iterate through each chapter, split again and insert immediately
        for (let chapterIndex = 0; chapterIndex < documents.length; chapterIndex++) {
            const chapter = documents[chapterIndex];
            const chapterContent = chapter.pageContent;

            console.log(`Processing chapter ${chapterIndex + 1}/${documents.length}...`);

            // Use splitter for secondary splitting
            const chunks = await textSplitter.splitText(chapterContent);

            console.log(`   Split into ${chunks.length} fragments`);

            if (chunks.length === 0) {
                console.log(`   Skipping empty chapter\n`);
                continue;
            }

            console.log(`   Generating vectors and inserting...`);

            // Generate vectors and insert all fragments of this chapter immediately
            const insertedCount = await insertChunksBatch(chunks, bookId, chapterIndex + 1);
            totalInserted += insertedCount;

            console.log(`   ✓ Inserted ${insertedCount} records (Cumulative: ${totalInserted})\n`);
        }

        console.log(`\nTotal inserted ${totalInserted} records\n`);
        return totalInserted;
    } catch (error) {
        console.error('Error loading EPUB file:', error.message);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('='.repeat(80));
        console.log('Ebook Processor');
        console.log('='.repeat(80));

        // Connect to Milvus
        console.log('\nConnecting to Milvus...');
        await client.connectPromise;
        console.log('✓ Connected\n');

        // Set book_id
        const bookId = '1';

        // Ensure collection exists
        await ensureCollection(bookId);

        // Load and process EPUB file (streaming processing, process and insert simultaneously)
        await loadAndProcessEPubStreaming(bookId);

        console.log('='.repeat(80));
        console.log('Processing completed!');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\nError:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
