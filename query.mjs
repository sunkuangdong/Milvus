import { MetricType } from '@zilliz/milvus2-sdk-node';
import { getEmbedding, client } from "./insert.mjs";

const COLLECTION_NAME = 'ai_diary';

export async function searchDiary(queryString) {
    try {
        console.log(`\nSearching for similar diary entries...`);
        console.log(`Query: "${queryString}"\n`);

        const queryVector = await getEmbedding(queryString);
        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            vector: queryVector,
            limit: 2,
            metric_type: MetricType.COSINE,
            output_fields: ['id', 'content', 'date', 'mood', 'tags']
        });

        console.log(`Found ${searchResult.results.length} results:\n`);
        searchResult.results.forEach((item, index) => {
            console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
            console.log(`   ID: ${item.id}`);
            console.log(`   Date: ${item.date}`);
            console.log(`   Mood: ${item.mood}`);
            console.log(`   Tags: ${item.tags?.join(', ')}`);
            console.log(`   Content: ${item.content}\n`);
        });

    } catch (error) {
        console.error('Error during search:', error.message);
    }
}
