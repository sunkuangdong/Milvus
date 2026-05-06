# Milvus Node.js Example

This project demonstrates how to connect to a local Milvus vector database using Node.js, and perform basic operations like inserting, updating, querying, and deleting vector data. It also includes an example of Retrieval-Augmented Generation (RAG) using LangChain and OpenAI.

## Prerequisites

- Node.js installed
- Docker and Docker Compose installed
- An OpenAI API Key

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

2. Create a `.env` file in the root directory and add your OpenAI credentials:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_BASE_URL=https://api.openai.com/v1
   EMBEDDINGS_MODEL_NAME=text-embedding-3-small
   MODEL_NAME=gpt-4o-mini
   ```

## Scripts

- `main.mjs`: Initializes the collection, creates an index, generates embeddings, and inserts diary entries.
- `insert.mjs`: Contains configuration and initialization for the Milvus client and OpenAI embeddings.
- `query.mjs`: Performs a similarity search in the Milvus database.
- `update.mjs`: Updates an existing entry in the database.
- `delete.mjs`: Deletes specific entries from the database.
- `rag.mjs`: A simple RAG implementation that retrieves relevant diary entries to answer a question using OpenAI.
