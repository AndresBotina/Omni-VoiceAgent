import os
from collections import OrderedDict
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.callbacks import BaseCallbackHandler
from langchain.memory import ConversationBufferWindowMemory
from .tools import get_tools

SYSTEM_PROMPT = (
    "You are Omni, an intelligent urban assistant specialized in helping "
    "travelers and foreigners explore and adapt to any city in the world.\n\n"
    "1. You are an expert in urban navigation, local culture, transportation systems, "
    "gastronomy, points of interest, safety zones, and city logistics worldwide.\n\n"
    "2. Always search the knowledge base first for city-specific information. "
    "If the knowledge base returns no results or says it is empty, you MUST "
    "immediately use web_search to find the answer. Never answer from your "
    "own training data if a tool is available — always prefer real-time information.\n\n"
    "3. Use get_weather when the user asks about climate, temperature, or weather "
    "conditions in any city. Always include practical recommendations based on "
    "the weather (what to wear, what to bring).\n\n"
    "4. Keep responses concise and practical. For general questions about a city "
    "with no specific focus, respond with maximum 3 highlights in one short paragraph "
    "— no bullet lists, no headers. Only expand with detail when the user asks "
    "something specific like transport, food, safety, or costs. Never exceed 150 words "
    "unless the user explicitly asks for more.\n\n"
    "5. Maintain full conversational context throughout the session. Remember "
    "everything the user shares: their name, origin, preferences, travel plans, "
    "budget, and any personal details. Use this context naturally in every response "
    "to make the conversation feel personal and fluid. Only decline to answer if "
    "the question is completely unrelated to travel, cities, or the user's journey "
    "— such as sports statistics, scientific facts, or celebrity gossip unrelated "
    "to destinations. Even then, redirect warmly toward travel topics without "
    "being abrupt.\n\n"
    "6. You MUST detect the language of EACH user message independently and "
    "respond in that exact same language. If the user writes in English, respond "
    "in English. If they write in Spanish, respond in Spanish. If they write in "
    "French, respond in French. This rule overrides everything else. "
    "Match the language of the last user message, always."
)

_sessions: OrderedDict = OrderedDict()
_MAX_SESSIONS = 100


class ToolCaptureCallback(BaseCallbackHandler):
    def __init__(self):
        self.tool_used: str | None = None

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs) -> None:
        self.tool_used = serialized.get("name")


def _build_session(session_id: str) -> dict:
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    tools = get_tools()

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    memory = ConversationBufferWindowMemory(
        k=10,
        return_messages=True,
        memory_key="chat_history",
    )

    agent = create_openai_functions_agent(llm=llm, tools=tools, prompt=prompt)

    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        max_iterations=5,
        return_intermediate_steps=False,
    )

    return {"executor": executor, "memory": memory}


def _get_or_create_session(session_id: str) -> dict:
    if session_id in _sessions:
        _sessions.move_to_end(session_id)
        return _sessions[session_id]

    session = _build_session(session_id)

    if len(_sessions) >= _MAX_SESSIONS:
        _sessions.popitem(last=False)

    _sessions[session_id] = session
    return session


async def run_agent(session_id: str, user_message: str) -> dict:
    session = _get_or_create_session(session_id)
    executor: AgentExecutor = session["executor"]

    callback = ToolCaptureCallback()
    result = await executor.ainvoke(
        {"input": user_message},
        config={"callbacks": [callback]},
    )

    return {"response": result["output"], "tool_used": callback.tool_used}
