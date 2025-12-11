from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_openai import ChatOpenAI
from os import getenv
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()


embedding = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')

llm = ChatOpenAI(
    api_key=getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    model="meta-llama/llama-3.3-70b-instruct:free"
)

prompt = PromptTemplate(
    template="""
        You are a helpful assistant.
        Answer only from the provided transcript context.
        If the context is insufficient, just say you don't know.

        {context}
        Question: {question}
    """,
    input_variables=['context', 'question']
)

def _build_chain_from_transcript(transcript: str):
    #  Text Splitting
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([transcript])

    # Embeddings + Vector store
    vector_store = FAISS.from_documents(chunks, embedding)
    retriever = vector_store.as_retriever(search_type='similarity',
                                          search_kwargs={'k': 4})

    def format_text(retrieved_docs):
        context_text = '\n\n'.join(doc.page_content for doc in retrieved_docs)
        return context_text

    parallel_chain = RunnableParallel({
        'context': retriever | RunnableLambda(format_text),
        'question': RunnablePassthrough()
    })

    parsers = StrOutputParser()
    final_chain = parallel_chain | prompt | llm | parsers
    return final_chain

def _get_transcript_text(video_id: str) -> str:
    try:
        ytt_api = YouTubeTranscriptApi()
        fetched = ytt_api.fetch(video_id, languages=["en"])
        transcript_list = fetched.to_raw_data()
        transcript = " ".join(chunk["text"] for chunk in transcript_list)
        return transcript
    except TranscriptsDisabled:
        raise ValueError("No caption available for this video.")

    except Exception as e:
        raise RuntimeError(f"Error while fetching transcript or can you check your Internet connection.")

def answer_question(video_id: str, question: str) -> str:
    """Main function used by Django view."""
    transcript = _get_transcript_text(video_id)
    chain = _build_chain_from_transcript(transcript)
    answer = chain.invoke(question)
    return answer
