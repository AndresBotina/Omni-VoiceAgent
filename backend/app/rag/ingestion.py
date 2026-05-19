import os
import httpx
import psycopg2
from bs4 import BeautifulSoup
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from pgvector.psycopg2 import register_vector


async def ingest_url(url: str) -> int:
    # Fetch the page HTML
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, headers={"User-Agent": "VoiceAgent/1.0"})
        response.raise_for_status()
        html = response.text

    # Extract readable text from paragraph and heading tags
    soup = BeautifulSoup(html, "html.parser")
    parts = [tag.get_text(strip=True) for tag in soup.find_all(["p", "h1", "h2", "h3", "li"])]
    raw_text = "\n".join(parts).strip()

    if not raw_text:
        raise ValueError("No extractable text found at URL")

    # Split into overlapping chunks to preserve context across boundaries
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(raw_text)

    # Embed all chunks in one batch using OpenAI's small embedding model
    embeddings_model = OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    vectors = embeddings_model.embed_documents(chunks)

    # First connection: ensure schema exists (DDL committed before inserts)
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    register_vector(conn)
    cur = conn.cursor()
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id TEXT PRIMARY KEY,
            embedding vector(1536),
            text TEXT,
            source TEXT
        );
    """)
    conn.commit()
    cur.close()
    conn.close()

    # Second connection: upsert each chunk with its embedding and source URL
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    register_vector(conn)
    try:
        with conn.cursor() as cur:
            for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
                cur.execute(
                    """
                    INSERT INTO knowledge_base (id, embedding, text, source)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE
                        SET embedding = EXCLUDED.embedding,
                            text      = EXCLUDED.text,
                            source    = EXCLUDED.source;
                    """,
                    (f"chunk-{i}", vector, chunk, url),
                )
        conn.commit()
    finally:
        conn.close()

    return len(chunks)
