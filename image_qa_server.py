import os
from flask import Flask, request, render_template, jsonify, session, send_from_directory
from PIL import Image
import pytesseract
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from werkzeug.utils import secure_filename
import tempfile
import io
import PyPDF2
import speech_recognition as sr
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import difflib

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Needed for session
app.template_folder = os.path.join(os.path.dirname(__file__), 'templates')
app.static_folder = os.path.join(os.path.dirname(__file__), 'static')

# LLM setup (uses DeepSeek open-source LLM)
def get_llm():
    # Use the general DeepSeek model in Ollama (make sure it's pulled and running)
    return ChatOllama(model="deepseek-llm:7b", temperature=0, num_ctx=8192)

def get_prompt():
    template = (
        """You are a helpful tech assistant for seniors.\n"
        "Given the following context (from text, image, document, or voice), answer the user's tech question in a clear, short, step-by-step, and friendly way.\n"
        "ALWAYS answer in the following strict format: Each step must start with 'Step 1:', 'Step 2:', etc., with each step on a new line. Do NOT add any introduction, summary, or text before or after the steps. Only output the steps.\n"
        "If the text is unclear or seems like a screenshot, summarize the main points and mention if the text is hard to read, but still use the step format.\n"
        "\nExtracted context:\n{context}\n\nQuestion: {question}\n"""
    )
    return ChatPromptTemplate.from_template(template)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data')
PDF_FILENAME = 'Senior Tech Helper Knowledge Base.pdf'
PDF_KB_PATH = r'C:\Users\taksh\venv\Scripts\data\Senior Tech Helper Knowledge Base.pdf'

# Add new user questions to the PDF knowledge base if not already present
def add_question_to_pdf_kb(question):
    question = question.strip()
    if not question:
        return
    pdf_path = PDF_KB_PATH
    # Read existing PDF text
    reader = PdfReader(pdf_path)
    all_text = " ".join(page.extract_text() or '' for page in reader.pages)
    if question.lower() in all_text.lower():
        return  # Already present
    # Create a temporary PDF with the question
    temp_pdf_path = os.path.join(os.path.dirname(pdf_path), 'temp_question.pdf')
    c = canvas.Canvas(temp_pdf_path, pagesize=A4)
    c.setFont("Helvetica", 14)
    c.drawString(72, 800, "User Question:")
    c.setFont("Helvetica", 12)
    c.drawString(72, 780, question)
    c.save()
    # Append the new page to the original PDF
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    with open(temp_pdf_path, 'rb') as f:
        temp_reader = PdfReader(f)
        writer.add_page(temp_reader.pages[0])
    with open(pdf_path, 'wb') as f:
        writer.write(f)
    os.remove(temp_pdf_path)

def find_similar_question(existing_questions, new_question, threshold=0.85):
    """Return the most similar question if above threshold, else None."""
    matches = difflib.get_close_matches(new_question, existing_questions, n=1, cutoff=threshold)
    return matches[0] if matches else None

def add_qa_to_pdf_kb(question, answer):
    question = question.strip()
    answer = answer.strip()
    if not question or not answer:
        return
    pdf_path = PDF_KB_PATH
    # Read existing PDF text and collect all questions
    reader = PdfReader(pdf_path)
    all_text = " ".join(page.extract_text() or '' for page in reader.pages)
    # Extract all previous questions (naive: lines starting with 'User Question:')
    import re
    existing_questions = re.findall(r'User Question:(.*)', all_text, re.IGNORECASE)
    existing_questions = [q.strip() for q in existing_questions]
    # Check for similar question
    similar = find_similar_question(existing_questions, question)
    if similar:
        return  # Don't add duplicate/similar question
    # Create a temporary PDF with the Q&A
    temp_pdf_path = os.path.join(os.path.dirname(pdf_path), 'temp_qa.pdf')
    c = canvas.Canvas(temp_pdf_path, pagesize=A4)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, 800, "User Question:")
    c.setFont("Helvetica", 12)
    c.drawString(72, 780, question)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, 750, "AI Answer:")
    c.setFont("Helvetica", 12)
    # Split answer into lines for PDF
    y = 730
    for line in answer.split('\n'):
        if y < 100:
            c.showPage();
            y = 800;
        c.drawString(72, y, line);
        y -= 18;
    c.save()
    # Append the new page to the original PDF
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    with open(temp_pdf_path, 'rb') as f:
        temp_reader = PdfReader(f)
        writer.add_page(temp_reader.pages[0])
    with open(pdf_path, 'wb') as f:
        writer.write(f)
    os.remove(temp_pdf_path)

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error. Please try again later.'}), 500

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/', methods=['GET'])
def home():
    session.permanent = True
    return render_template('index.html')

@app.route('/reset', methods=['POST'])
def reset_chat():
    session.pop('history', None)
    return jsonify({'success': True})

@app.route('/', methods=['POST'])
def upload_multimodal():
    try:
        context_parts = []
        text_prompt = request.form.get('text_prompt', '').strip()
        if text_prompt:
            context_parts.append(f"Text: {text_prompt}")
            add_question_to_pdf_kb(text_prompt)
        if 'image' in request.files and request.files['image'].filename:
            try:
                image = Image.open(request.files['image'].stream)
                ocr_text = pytesseract.image_to_string(image)
                if ocr_text.strip():
                    context_parts.append(f"Image OCR: {ocr_text.strip()}")
            except Exception as e:
                context_parts.append(f"Image OCR: [Error: {e}]")
        if 'document' in request.files and request.files['document'].filename:
            try:
                pdf_file = request.files['document']
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                pdf_text = " ".join(page.extract_text() or '' for page in pdf_reader.pages)
                if pdf_text.strip():
                    context_parts.append(f"PDF: {pdf_text.strip()}")
            except Exception as e:
                context_parts.append(f"PDF: [Error: {e}]")
        if 'voice' in request.files and request.files['voice'].filename:
            recognizer = sr.Recognizer()
            audio_file = request.files['voice']
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
                try:
                    audio_file.save(temp_audio.name)
                    with sr.AudioFile(temp_audio.name) as source:
                        audio = recognizer.record(source)
                        try:
                            voice_text = recognizer.recognize_google(audio)
                            if voice_text.strip():
                                context_parts.append(f"Voice: {voice_text.strip()}")
                        except Exception as e:
                            context_parts.append(f"Voice: [Could not transcribe audio: {e}]")
                except Exception as e:
                    context_parts.append(f"Voice: [Audio error: {e}]")
                finally:
                    os.remove(temp_audio.name)
        context = "\n".join(context_parts)
        if 'history' not in session:
            session['history'] = []
        session['history'].append({'user': context})
        history_text = "\n\n".join([f"User: {h['user']}\nAI: {h.get('ai','')}" for h in session['history']])
        llm = get_llm()
        prompt = get_prompt()
        chain = (
            {"context": lambda _: context + "\n\nChat history:\n" + history_text, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        answer = chain.invoke(text_prompt or "What is in the provided context?")
        session['history'][-1]['ai'] = answer
        if text_prompt:
            add_qa_to_pdf_kb(text_prompt, answer)
        history_html = "".join([
            f"<div class='chat-row user'><div class='avatar user-avatar'>🧑</div><div class='bubble user-bubble'>{h['user']}</div></div>" +
            (f"<div class='chat-row ai'><div class='avatar ai-avatar'>🤖</div><div class='bubble ai-bubble'>{h.get('ai','')}</div></div>" if h.get('ai') else '')
            for h in session['history']
        ])
        return jsonify({'context': context, 'answer': answer, 'history_html': history_html})
    except Exception as e:
        return jsonify({'error': f'An error occurred: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
