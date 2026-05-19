from langchain.memory import ConversationBufferWindowMemory
from langchain_core.messages import BaseMessage
from typing import List


def create_memory(window_size: int = 10) -> ConversationBufferWindowMemory:
    return ConversationBufferWindowMemory(
        k=window_size,
        return_messages=True,
        memory_key="chat_history",
    )


def format_history(messages: List[BaseMessage]) -> str:
    lines = []
    for msg in messages:
        role = "User" if msg.type == "human" else "Assistant"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)
