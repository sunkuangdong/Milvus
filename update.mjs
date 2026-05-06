import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { getEmbedding, client } from "./insert.mjs";

const COLLECTION_NAME = 'ai_diary';

async function updateDiary() {
    try {
        console.log('Updating diary entry...');
        const updateId = 'diary_001';
        const updatedContent = {
            id: updateId,
            content: '今天下了一整天的雨，心情很糟糕。工作上遇到了很多困难，感觉压力很大。一个人在家，感觉特别孤独。',
            date: '2026-01-10',
            mood: 'sad',
            tags: ['生活', '散步', '朋友']
        };

        console.log('Generating new embedding...');
        const vector = await getEmbedding(updatedContent.content);
        const updateData = { ...updatedContent, vector };

        const result = await client.upsert({
            collection_name: COLLECTION_NAME,
            data: [updateData]
        });

        console.log(`✓ Updated diary entry: ${updateId}`);
        console.log(`   New content: ${updatedContent.content}`);
        console.log(`   New mood: ${updatedContent.mood}`);
        console.log(`   New tags: ${updatedContent.tags.join(', ')}\n`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}
updateDiary();