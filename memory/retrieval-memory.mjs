import 'dotenv/config';
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const COLLECTION_NAME = 'conversations';
const VECTOR_DIM = 768; // Updated for nomic-embed-text compatibility

// Initialize OpenAI Chat model
const model = new ChatOpenAI({ 
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// Initialize Embeddings model
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OLLAMA_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OLLAMA_BASE_URL,
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
 * Retrieve relevant historical conversations from Milvus
 */
async function retrieveRelevantConversations(query, k = 2) {
  try {
    // Generate query vector
    const queryVector = await getEmbedding(query);

    // Search for similar conversations in Milvus
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: k,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'content', 'round', 'timestamp']
    });

    return searchResult.results;
  } catch (error) {
    console.error('Error retrieving conversations:', error.message);
    return [];
  }
}

/**
 * Strategy 3: Retrieval Memory
 * Use Milvus vector database to store historical conversations, retrieve semantically related history based on current input
 * Implements RAG (Retrieval-Augmented Generation) flow
 */
async function retrievalMemoryDemo() {  
  try {
    console.log('Connecting to Milvus...');
    await client.connectPromise;
    console.log('✓ Connected\n');
  } catch (error) {
    console.error('❌ Cannot connect to Milvus:', error.message);
    console.log('Please ensure Milvus service is running (localhost:19530)');
    return;
  }

  // Ensure collection is loaded
  try {
    await client.loadCollection({ collection_name: COLLECTION_NAME });
  } catch (error) {
    if (!error.message.includes('already loaded')) {
      console.warn('Warning: Could not load collection:', error.message);
    }
  }

  // Create history message storage
  const history = new InMemoryChatMessageHistory();

  const conversations = [
    { input: "我之前提到的机器学习项目进展如何？" },
    { input: "我周末经常做什么？" },
    { input: "我的职业是什么？" },
  ];

  for (let i = 0; i < conversations.length; i++) {
    const { input } = conversations[i];
    const userMessage = new HumanMessage(input);
    
    console.log(`\n[Round ${i + 1} of Conversation]`);
    console.log(`User: ${input}`);
    
    // 1. Retrieve relevant historical conversations
    console.log('\n[Retrieving relevant historical conversations]');
    const retrievedConversations = await retrieveRelevantConversations(input, 2);
    
    let relevantHistory = "";
    if (retrievedConversations.length > 0) {
      // Display retrieved relevant history and similarity
      retrievedConversations.forEach((conv, idx) => {
        console.log(`\n[Historical Conversation ${idx + 1}] Similarity: ${conv.score.toFixed(4)}`);
        console.log(`Round: ${conv.round}`);
        console.log(`Content: ${conv.content}`);
      });
      
      // Build context
      relevantHistory = retrievedConversations
        .map((conv, idx) => {
          return `[Historical Conversation ${idx + 1}]
                    Round: ${conv.round}
                    ${conv.content}`;
        })
        .join('\n\n━━━━━\n\n');
    } else {
      console.log('No relevant historical conversations found');
    }
    
    // 2. Build prompt (using retrieved history as context)
    const contextMessages = relevantHistory 
      ? [
          new HumanMessage(`Relevant historical conversations:\n${relevantHistory}\n\nUser Question: ${input}`)
        ]
      : [userMessage];
    
    // 3. Call model to generate answer
    console.log('\n[AI Answer]');
    const response = await model.invoke(contextMessages);
    
    // Save current conversation to history messages
    await history.addMessage(userMessage);
    await history.addMessage(response);
    
    // 4. Save conversation to Milvus vector database
    const conversationText = `User: ${input}\nAssistant: ${response.content}`;
    const convId = `conv_${Date.now()}_${i + 1}`;
    const convVector = await getEmbedding(conversationText);
    
    try {
      await client.insert({
        collection_name: COLLECTION_NAME,
        data: [{
          id: convId,
          vector: convVector,
          content: conversationText,
          round: i + 1,
          timestamp: new Date().toISOString()
        }]
      });
      console.log(`💾 Saved to Milvus vector database`);
    } catch (error) {
      console.warn('Error saving to vector database:', error.message);
    }
    
    console.log(`Assistant: ${response.content}`);
  }
}

retrievalMemoryDemo().catch(console.error);