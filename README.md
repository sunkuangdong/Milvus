# Milvus Node.js Example

This project demonstrates how to connect to a local Milvus vector database using Node.js, and perform basic operations like inserting, updating, querying, and deleting vector data. It also includes an example of Retrieval-Augmented Generation (RAG) using LangChain and OpenAI.

## Prerequisites

- Node.js installed
- Docker and Docker Compose installed
- Ollama installed (for local embedding generation)

## Run Local Embedding Model (Ollama)

To avoid OpenAI API rate limits and costs when processing large documents, we use **Ollama** to run a local embedding model (`nomic-embed-text`).

1. Download and install Ollama from [ollama.com](https://ollama.com/) (For macOS, download the `.zip` file, extract `Ollama.app`, and drag it to the Applications folder).
2. Open the Ollama application. You should see the Ollama icon in your top menu bar, indicating the background service is running on `http://localhost:11434`.
3. Open a terminal and run the following command to download the embedding model:
   ```bash
   ollama run nomic-embed-text
   ```

## Run Milvus and Attu (Docker)

You can easily start a local Milvus standalone instance along with **Attu** (the graphical admin UI for Milvus) using the provided Docker Compose file.

1. Start the services in the background:
   ```bash
   docker compose -f milvus-standalone-docker-compose.yml up -d
   ```

2. Access the services:
   - **Milvus Database:** `localhost:19530`
   - **Attu UI:** Open your browser and go to [http://localhost:8000](http://localhost:8000) (Login with Milvus Address: `milvus-standalone:19530`)

3. To stop the services later:
   ```bash
   docker compose -f milvus-standalone-docker-compose.yml down
   ```

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file in the root directory and configure it for local Ollama usage:
   ```env
   # Use local Ollama service instead of OpenAI
   OPENAI_BASE_URL=http://localhost:11434/v1
   EMBEDDINGS_MODEL_NAME=nomic-embed-text
   OPENAI_API_KEY=ollama-local-key

   # Used for RAG Q&A (can be switched to a local LLM like llama3 later)
   MODEL_NAME=gpt-4o-mini
   ```

> **Note on Vector Dimensions:** The `nomic-embed-text` model generates 768-dimensional vectors. Make sure your scripts (e.g., `ebook-writer.mjs`) have `const VECTOR_DIM = 768;` set accordingly. If you previously created a collection with 1024 dimensions, you must drop it first.

## Scripts

- `main.mjs`: Initializes the collection, creates an index, generates embeddings, and inserts diary entries.
- `insert.mjs`: Contains configuration and initialization for the Milvus client and OpenAI embeddings.
- `query.mjs`: Performs a similarity search in the Milvus database.
- `update.mjs`: Updates an existing entry in the database.
- `delete.mjs`: Deletes specific entries from the database.
- `rag.mjs`: A simple RAG implementation that retrieves relevant diary entries to answer a question using OpenAI.
