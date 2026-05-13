# Milvus + LangChain Node.js Examples

This repository contains runnable examples across multiple topics: Milvus vector database, LangChain Runnables, Prompt Templates, Output Parsers, Memory, and MCP integrations.

## Quick Start

- Install dependencies: `pnpm install`
- Start Milvus (with Attu): `docker compose -f milvus-standalone-docker-compose.yml up -d`
- For local embeddings (Ollama): start `ollama serve`, then pull `ollama pull nomic-embed-text`

## Recommended Environment Variables

Create and maintain a `.env` file in the project root with at least these groups:

- **Chat model**
  - `OPENAI_BASE_URL`
  - `OPENAI_API_KEY`
  - `MODEL_NAME`
- **Embedding model (local Ollama)**
  - `OLLAMA_BASE_URL`
  - `OLLAMA_API_KEY`
  - `EMBEDDINGS_MODEL_NAME`
  - `VECTOR_DIM` (optional)
- **MCP (Google Maps)**
  - `GOOGLE_MAPS_API_KEY`
- **Milvus**
  - `MILVUS_ADDRESS` (default: `localhost:19530`)

> Note: Embedding dimensions must match your Milvus collection vector dimensions (for example, `nomic-embed-text` is commonly 768).

## Code Guide: Clickable Links

- **Milvus Basic CRUD and Search**
  - [main.mjs](main.mjs)
  - [insert.mjs](insert.mjs)
  - [query.mjs](query.mjs)
  - [update.mjs](update.mjs)
  - [delete.mjs](delete.mjs)
  - [rag.mjs](rag.mjs)
  - Summary: This section contains the foundational scripts for creating collections, inserting vectors, querying by similarity, updating records, deleting records, and running a minimal RAG pipeline. If you are setting up the project for the first time, start here to verify Milvus connectivity, collection schema, index setup, and end-to-end vector operations before moving to higher-level orchestration examples.

- **Ebook RAG Scenarios**
  - [src/ebook-writer.mjs](src/ebook-writer.mjs)
  - [src/ebook-query.mjs](src/ebook-query.mjs)
  - [src/ebook-reader-rag.mjs](src/ebook-reader-rag.mjs)
  - [cases/ebook-reader-rag.mjs](cases/ebook-reader-rag.mjs)
  - Summary: These scripts focus on a practical long-document workflow: chunking and ingesting ebook content, retrieving relevant passages, and producing final answers from retrieved context. They are useful for understanding realistic RAG concerns such as embedding model consistency, chunk quality, retrieval depth (`k`), and prompt grounding quality for long-form QA tasks.

- **Prompt Template Examples**
  - [prompt-template-test/prompt-template1.mjs](prompt-template-test/prompt-template1.mjs)
  - [prompt-template-test/partial.mjs](prompt-template-test/partial.mjs)
  - [prompt-template-test/chat-prompt-template.mjs](prompt-template-test/chat-prompt-template.mjs)
  - [prompt-template-test/chat-prompt-template2.mjs](prompt-template-test/chat-prompt-template2.mjs)
  - [prompt-template-test/messages-placeholder.mjs](prompt-template-test/messages-placeholder.mjs)
  - [prompt-template-test/pipeline-prompt-template.mjs](prompt-template-test/pipeline-prompt-template.mjs)
  - [prompt-template-test/pipeline-prompt-template2.mjs](prompt-template-test/pipeline-prompt-template2.mjs)
  - [prompt-template-test/pipeline-prompt-template3.mjs](prompt-template-test/pipeline-prompt-template3.mjs)
  - [prompt-template-test/fewshot-prompt-template.mjs](prompt-template-test/fewshot-prompt-template.mjs)
  - [prompt-template-test/fewshot-chat-prompt-template.mjs](prompt-template-test/fewshot-chat-prompt-template.mjs)
  - [prompt-template-test/example-selector1.mjs](prompt-template-test/example-selector1.mjs)
  - [prompt-template-test/example-selector2.mjs](prompt-template-test/example-selector2.mjs)
  - [prompt-template-test/weekly-report-examples-writer-milvus.mjs](prompt-template-test/weekly-report-examples-writer-milvus.mjs)
  - Summary: This group demonstrates how to build prompts from simple templates to advanced multi-part prompt pipelines, including placeholders, chat message structures, and few-shot example injection. It also includes selector-based example retrieval, which helps you compare static prompt design vs dynamic prompt assembly and understand how each approach affects model behavior.

- **Runnable Basics and Advanced**
  - [runnable/before.mjs](runnable/before.mjs)
  - [runnable/runnable.mjs](runnable/runnable.mjs)
  - [runnable/RunnableLambda.mjs](runnable/RunnableLambda.mjs)
  - [runnable/RunnableMap.mjs](runnable/RunnableMap.mjs)
  - [runnable/RunnableBranch.mjs](runnable/RunnableBranch.mjs)
  - [runnable/RouterRunnable.mjs](runnable/RouterRunnable.mjs)
  - [runnable/RunnablePassthrough.mjs](runnable/RunnablePassthrough.mjs)
  - [runnable/RunnableEach.mjs](runnable/RunnableEach.mjs)
  - [runnable/RunablePick.mjs](runnable/RunablePick.mjs)
  - [runnable/RunnableWithMessageHistory.mjs](runnable/RunnableWithMessageHistory.mjs)
  - [runnables/RunnableWithRetry.mjs](runnables/RunnableWithRetry.mjs)
  - [runnables/RunnableWithFallbacks.mjs](runnables/RunnableWithFallbacks.mjs)
  - [runnables/RunnableWithConfig.mjs](runnables/RunnableWithConfig.mjs)
  - [runnables/RunnableWithCallbacks.mjs](runnables/RunnableWithCallbacks.mjs)
  - Summary: This section explains runnable composition from basic sequential chaining to conditional routing, passthrough state handling, map-style fan-out, and history-aware interactions. It also introduces production-oriented patterns such as retries, fallback chains, runtime config injection, and callback-based tracing so you can build resilient, testable, and observable LLM workflows.

- **Output Parser Examples**
  - [output-parser-test/normal.mjs](output-parser-test/normal.mjs)
  - [output-parser-test/structured-output-parser.mjs](output-parser-test/structured-output-parser.mjs)
  - [output-parser-test/structured-output-parser2.mjs](output-parser-test/structured-output-parser2.mjs)
  - [output-parser-test/with-structured-output.mjs](output-parser-test/with-structured-output.mjs)
  - [output-parser-test/xml-output-parser.mjs](output-parser-test/xml-output-parser.mjs)
  - [output-parser-test/tool-call-args.mjs](output-parser-test/tool-call-args.mjs)
  - [output-parser-test/stream-normal.mjs](output-parser-test/stream-normal.mjs)
  - [output-parser-test/stream-with-structured-output.mjs](output-parser-test/stream-with-structured-output.mjs)
  - [output-parser-test/stream-structured-partial.mjs](output-parser-test/stream-structured-partial.mjs)
  - [output-parser-test/stream-tool-calls-raw.mjs](output-parser-test/stream-tool-calls-raw.mjs)
  - [output-parser-test/stream-tool-calls-parser.mjs](output-parser-test/stream-tool-calls-parser.mjs)
  - Summary: These examples show multiple ways to parse model output into deterministic formats, including structured JSON parsing, XML parsing, tool-call argument parsing, and streaming partial parse handling. This section is especially useful when integrating model outputs into downstream systems that require strict schemas and predictable field-level outputs.

- **Memory Examples**
  - [memory/insert-conversations.mjs](memory/insert-conversations.mjs)
  - [memory/retrieval-memory.mjs](memory/retrieval-memory.mjs)
  - [memory/history-test.mjs](memory/history-test.mjs)
  - [memory/history-test2.mjs](memory/history-test2.mjs)
  - [memory/history-test3.mjs](memory/history-test3.mjs)
  - [memory/truncation-memory.mjs](memory/truncation-memory.mjs)
  - [memory/summarization-memory.mjs](memory/summarization-memory.mjs)
  - [memory/summarization-memory2.mjs](memory/summarization-memory2.mjs)
  - Summary: The memory scripts compare different conversation memory strategies, including retrieval-based memory, truncation windows, and summarization compression over long sessions. Use this section to understand trade-offs between context fidelity, token cost, and long-term coherence in multi-turn assistant behavior.

- **Agent / MCP Examples**
  - [mini-Cursor/mini-cursor.mjs](mini-Cursor/mini-cursor.mjs)
  - [mini-Cursor/all-tools.mjs](mini-Cursor/all-tools.mjs)
  - [cases/mcp-test.mjs](cases/mcp-test.mjs)
  - [mini-Cursor-test/create-table.mjs](mini-Cursor-test/create-table.mjs)
  - [mini-Cursor-test/smart-import.mjs](mini-Cursor-test/smart-import.mjs)
  - [mini-Cursor-test/structured-json-schema.mjs](mini-Cursor-test/structured-json-schema.mjs)
  - Summary: This section covers agent-style tool-calling loops, MCP server integration, and utility experiments around structured outputs and automation patterns. It provides a practical view of how model reasoning, tool execution, intermediate state updates, and external service connectivity work together in full agent workflows.

## Final Summary

- The repository now forms a complete learning path from Milvus basics to advanced LangChain orchestration and MCP-integrated agent workflows.
- Most files are runnable, independent examples; you can study by folder without needing to understand the whole codebase first.
- Start from root CRUD scripts, then move to `prompt-template-test/` and `runnable/`, and finally to `cases/` for full end-to-end scenarios.
- Keep environment and infrastructure aligned (`.env`, model endpoints, Milvus status, and vector dimensions) to avoid most runtime issues.
