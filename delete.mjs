import { client } from './insert.mjs';

const COLLECTION_NAME = 'ai_diary';

export async function deleteDiary() {
    try {
        // Delete a single record
        console.log('Deleting diary entry...');
        const deleteId = 'diary_005';

        const result = await client.delete({
            collection_name: COLLECTION_NAME,
            filter: `id == "${deleteId}"`
        });

        console.log(`✓ Deleted ${result.delete_cnt} record(s)`);
        console.log(`   ID: ${deleteId}\n`);

        // Batch delete
        console.log('Batch deleting diary entries...');
        const deleteIds = ['diary_002', 'diary_003'];
        const idsStr = deleteIds.map(id => `"${id}"`).join(', ');

        const batchResult = await client.delete({
            collection_name: COLLECTION_NAME,
            filter: `id in [${idsStr}]`
        });

        console.log(`✓ Batch deleted ${batchResult.delete_cnt} record(s)`);
        console.log(`   IDs: ${deleteIds.join(', ')}\n`);

        // Conditional delete
        console.log('Deleting by condition...');
        const conditionResult = await client.delete({
            collection_name: COLLECTION_NAME,
            filter: `mood == "sad"`
        });

        console.log(`✓ Deleted ${conditionResult.delete_cnt} record(s) with mood="sad"\n`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

deleteDiary();
