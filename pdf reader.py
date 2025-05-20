# rag_local.py
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader # Or UnstructuredPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import sys


load_dotenv() # Optional: Loads environment variables from.env file

DATA_PATH = "data/"
PDF_FILENAME = "Senior Tech Helper Knowledge Base.pdf" # Replace with your PDF filename
CHROMA_PATH = "chroma_db" # Directory to store ChromaDB data

def load_documents():
    """Loads documents from the specified data path."""
    pdf_path = os.path.join(DATA_PATH, PDF_FILENAME)
    loader = PyPDFLoader(pdf_path)
    # loader = UnstructuredPDFLoader(pdf_path) # Alternative
    documents = loader.load()
    print(f"Loaded {len(documents)} page(s) from {pdf_path}")
    return documents

# documents = load_documents() # Call this later

def split_documents(documents):
    """Splits documents into smaller, finer-grained chunks for better RAG granularity."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,  # Smaller chunks
        chunk_overlap=50,  # Less overlap
        length_function=len,
        is_separator_regex=False,
    )
    all_splits = text_splitter.split_documents(documents)
    print(f"Split into {len(all_splits)} chunks (chunk_size=300, overlap=50)")
    return all_splits

# loaded_docs = load_documents()
# chunks = split_documents(loaded_docs) # Call this later

def get_embedding_function(model_name="nomic-embed-text"):
    """Initializes the Ollama embedding function."""
    # Ensure Ollama server is running (ollama serve)
    embeddings = OllamaEmbeddings(model=model_name)
    print(f"Initialized Ollama embeddings with model: {model_name}")
    return embeddings

# embedding_function = get_embedding_function() # Call this later

def get_vector_store(embedding_function, persist_directory=CHROMA_PATH):
    """Initializes or loads the Chroma vector store."""
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_function
    )
    print(f"Vector store initialized/loaded from: {persist_directory}")
    return vectorstore

embedding_function = get_embedding_function()

def index_documents(chunks, embedding_function, persist_directory=CHROMA_PATH):
    """Indexes document chunks into the Chroma vector store."""
    print(f"Indexing {len(chunks)} chunks...")
    # Use from_documents for initial creation.
    # This will overwrite existing data if the directory exists but isn't a valid Chroma DB.
    # For incremental updates, initialize Chroma first and use vectorstore.add_documents().
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        persist_directory=persist_directory
    )
    vectorstore.persist() # Ensure data is saved
    print(f"Indexing complete. Data saved to: {persist_directory}")
    return vectorstore

def create_rag_chain(vector_store, llm_model_name="qwen3:8b", context_window=8192):
    """Creates the RAG chain."""
    llm = ChatOllama(
        model=llm_model_name,
        temperature=0,
        num_ctx=context_window
    )
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={'k': 3}
    )
    template = (
        """Answer the question based ONLY on the following context, and explain your answer in a clear, step-by-step, and senior-friendly way.\n"
        "{context}\n\nQuestion: {question}\n"""
    )
    prompt = ChatPromptTemplate.from_template(template)
    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain

def query_rag(chain, question):
    """Queries the RAG chain and prints the response."""
    print("\nQuerying RAG chain...")
    print(f"Question: {question}")
    response = chain.invoke(question)
    print("\nResponse:")
    print(response)

# Main execution
if __name__ == "__main__":
    loaded_docs = load_documents()
    chunks = split_documents(loaded_docs)
    embedding_function = get_embedding_function()

    import os
    db_exists = os.path.exists(CHROMA_PATH) and os.path.isdir(CHROMA_PATH) and len(os.listdir(CHROMA_PATH)) > 0
    if not db_exists:
        print("Indexing documents (no existing DB found)...")
        vector_store = index_documents(chunks, embedding_function)
    else:
        print("Loading existing vector store...")
        vector_store = get_vector_store(embedding_function)

    rag_chain = create_rag_chain(vector_store, llm_model_name="qwen3:8b")

    # Accept question from command line or use default
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
        query_rag(rag_chain, question)
    else:
        # Example questions
        query_rag(rag_chain, "What is the main topic of the document?")
        query_rag(rag_chain, "Summarize the introduction section.")