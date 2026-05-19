import os
import psycopg2
from langchain_openai import OpenAIEmbeddings
from pgvector.psycopg2 import register_vector


def query_knowledge_base(query: str, n_results: int = 3) -> list[str]:
    conn = None
    try:
        embeddings_model = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY"),
        )
        query_vector = embeddings_model.embed_query(query)

        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        register_vector(conn)
        with conn.cursor() as cur:
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
            cur.execute(
                """
                SELECT text FROM knowledge_base
                ORDER BY embedding <-> %s::vector
                LIMIT %s;
                """,
                (query_vector, n_results),
            )
            rows = cur.fetchall()
        return [row[0] for row in rows]
    except Exception as e:
        print(f"retriever error: {e}")
        return []
    finally:
        if conn:
            conn.close()
