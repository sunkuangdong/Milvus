import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = Number(process.env.VECTOR_DIM ?? 1024);

// Chat model config from .env (OPENAI_* / MODEL_NAME)
const model = new ChatOpenAI({
  temperature: Number(process.env.MODEL_TEMPERATURE ?? 0.7),
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// Embeddings config from .env (OLLAMA_* / EMBEDDINGS_MODEL_NAME)
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OLLAMA_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OLLAMA_BASE_URL,
  },
  dimensions: VECTOR_DIM,
});

// Initialize native Milvus client.
const milvusClient = new MilvusClient({
  address: process.env.MILVUS_ADDRESS ?? "localhost:19530",
});

const milvusSearch = new RunnableLambda({
  func: async (input) => {
    const { question, k = 5 } = input;

    try {
      // 1) Generate query embedding.
      const queryVector = await embeddings.embedQuery(question);

      // 2) Search Milvus.
      const searchResult = await milvusClient.search({
        collection_name: COLLECTION_NAME,
        vector: queryVector,
        limit: k,
        metric_type: MetricType.COSINE,
        output_fields: ["id", "book_id", "chapter_num", "index", "content"],
      });

      const results = searchResult.results ?? [];
      const retrievedContent = results.map((item, idx) => ({
        id: item.id,
        book_id: item.book_id,
        chapter_num: item.chapter_num,
        index: item.index ?? idx,
        content: item.content,
        score: item.score,
      }));

      return { question, retrievedContent };
    } catch (error) {
      console.error("Error while retrieving content:", error.message);
      return { question, retrievedContent: [] };
    }
  },
});

const promptTemplate = PromptTemplate.fromTemplate(
    `你是一个专业的《天龙八部》小说助手。基于小说内容回答问题，用准确、详细的语言。
    
    请根据以下《天龙八部》小说片段内容回答问题：
    {context}
    
    用户问题: {question}
    
    回答要求：
    1. 如果片段中有相关信息，请结合小说内容给出详细、准确的回答
    2. 可以综合多个片段的内容，提供完整的答案
    3. 如果片段中没有相关信息，请如实告知用户
    4. 回答要准确，符合小说的情节和人物设定
    5. 可以引用原文内容来支持你的回答
    
    AI 助手的回答:`
);

// Build runnable input context and print retrieval logs.
const buildPromptInput = new RunnableLambda({
  func: async (input) => {
    const { question, retrievedContent } = input;

    if (!retrievedContent.length) {
      return {
        hasContext: false,
        question,
        context: "",
        retrievedContent,
      };
    }

    // Print retrieval results.
    console.log("=".repeat(80));
    console.log(`Question: ${question}`);
    console.log("=".repeat(80));
    console.log("\n[Retrieved Context]");

    retrievedContent.forEach((item, i) => {
      console.log(`\n[Chunk ${i + 1}] Similarity: ${item.score ?? "N/A"}`);
      console.log(`Book: ${item.book_id}`);
      console.log(`Chapter: ${item.chapter_num}`);
      console.log(`Chunk Index: ${item.index}`);
      const content = item.content ?? "";
      console.log(
        `Content: ${content.substring(0, 200)}${
          content.length > 200 ? "..." : ""
        }`,
      );
    });

    const context = retrievedContent
      .map(
        (item, i) => `[Chunk ${i + 1}]
            Chapter: ${item.chapter_num}
            Content: ${item.content}`,
      ).join("\n\n━━━━━\n\n");

    return {
      hasContext: true,
      question,
      context,
      retrievedContent,
    };
  },
});

// Build the full RAG runnable (retrieve -> prompt input -> prompt -> LLM -> text).
const ragChain = RunnableSequence.from([
  milvusSearch,
  buildPromptInput,
  new RunnableLambda({
    func: async (input) => {
      const { hasContext, question, context } = input;

      if (!hasContext) {
        const fallback =
          "Sorry, I couldn't find relevant content from Demi-Gods and Semi-Devils. Please try a different question.";
        console.log(fallback);
        return { question, context: "", answer: fallback, noContext: true };
      }

      // PromptTemplate requires { question, context }.
      return { question, context, noContext: false };
    },
  }),
  promptTemplate,
  model,
  new StringOutputParser(),
]);

async function initMilvusCollection() {
  console.log("Connecting to Milvus...");
  await milvusClient.connectPromise;
  console.log("✓ Connected\n");

  try {
    await milvusClient.loadCollection({ collection_name: COLLECTION_NAME });
    console.log("✓ Collection loaded\n");
  } catch (error) {
    if (!error.message.includes("already loaded")) {
      throw error;
    }
    console.log("✓ Collection is already loaded\n");
  }
}

async function main() {
  try {
    await initMilvusCollection();

    const input = {
      question: "鸠摩智会什么武功？",
      k: 5,
    };

    console.log("=".repeat(80));
    console.log(`问题: ${input.question}`);
    console.log("=".repeat(80));
    console.log("\n【AI 流式回答】\n");

    const stream = await ragChain.stream(input);

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }

    console.log("\n");
  } catch (error) {
    console.error("错误:", error.message);
  }
}

await main();