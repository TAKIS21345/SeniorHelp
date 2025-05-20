import os
from flask import Flask, request, render_template_string, jsonify, session
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

# Improved HTML for chat-like layout
HTML = '''
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Multi-Modal Q&A for Seniors</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #b0b8c1; padding: 36px; }
    h2 { text-align: center; color: #1976d2; margin-bottom: 24px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    label { font-weight: 500; color: #333; }
    input[type="file"], input[type="text"] { padding: 12px; font-size: 1.1em; border-radius: 8px; border: 1px solid #b0b8c1; }
    input[type="submit"] { background: #1976d2; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 1.1em; cursor: pointer; transition: background 0.2s; }
    input[type="submit"]:hover { background: #125ea2; }
    .chat-box { margin-top: 32px; background: #f9fafb; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px #e0e4ea; }
    .user-msg { color: #1976d2; font-weight: bold; margin-bottom: 10px; }
    .ocr-text { color: #888; font-size: 1em; margin-bottom: 10px; }
    .card-stack { display: flex; flex-direction: column; gap: 18px; margin-top: 18px; }
    .step-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 8px #d0d4da; padding: 20px 24px; display: flex; flex-direction: column; align-items: flex-start; opacity: 0; transform: translateY(30px); transition: opacity 0.5s, transform 0.5s; }
    .step-card.visible { opacity: 1; transform: translateY(0); }
    .step-title { font-size: 1.1em; font-weight: 600; color: #1976d2; margin-bottom: 8px; }
    .step-desc { font-size: 1.05em; color: #333; margin-bottom: 12px; }
    .done-btn { background: #43a047; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 1em; cursor: pointer; transition: background 0.2s; }
    .done-btn:hover { background: #2e7031; }
    .history { margin-top: 24px; font-size: 0.98em; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Multi-Modal Q&amp;A for Seniors</h2>
    <form id="qa-form" method=post enctype=multipart/form-data>
      <label>Text prompt (optional):</label>
      <input type=text name=text_prompt placeholder="Type your question or context here">
      <label>Upload image (optional):</label>
      <input type=file name=image accept="image/*">
      <label>Upload document (PDF, optional):</label>
      <input type=file name=document accept="application/pdf">
      <label>Upload voice (WAV/MP3, optional):</label>
      <input type=file name=voice accept="audio/*">
      <input type=submit value="Ask">
    </form>
    <div class="chat-box" id="chat-box" style="display:none;">
      <div class="user-msg">You asked:<br><span id="user-question"></span></div>
      <div class="ocr-text" id="ocr-text"></div>
      <div class="card-stack" id="card-stack"></div>
    </div>
    <div class="history" id="history"></div>
  </div>
  <script>
    function splitSteps(answer) {
      // Try to split by numbered steps or bullet points, fallback to sentences
      let steps = answer.match(/\d+\.\s.+?(?=(?:\d+\.|$))/gs);
      if (!steps) {
        steps = answer.split(/\n- |\n• |\n/).filter(s => s.trim().length > 0);
      }
      if (steps.length === 1) {
        steps = answer.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      }
      return steps;
    }
    function showCards(steps) {
      const stack = document.getElementById('card-stack');
      stack.innerHTML = '';
      steps.forEach((step, idx) => {
        const card = document.createElement('div');
        card.className = 'step-card' + (idx === 0 ? ' visible' : '');
        card.innerHTML = `<div class='step-title'>Step ${idx+1}</div><div class='step-desc'>${step}</div>` +
          (idx < steps.length-1 ? `<button class='done-btn'>Done</button>` : `<span style='color:#43a047;font-weight:600;'>All done!</span>`);
        stack.appendChild(card);
      });
      // Animation and step logic
      let current = 0;
      const cards = stack.querySelectorAll('.step-card');
      cards.forEach((card, idx) => {
        if (idx > 0) card.style.display = 'none';
        const btn = card.querySelector('.done-btn');
        if (btn) {
          btn.onclick = () => {
            card.classList.remove('visible');
            setTimeout(() => {
              card.style.display = 'none';
              if (cards[idx+1]) {
                cards[idx+1].style.display = 'flex';
                setTimeout(() => cards[idx+1].classList.add('visible'), 10);
              }
            }, 400);
          };
        }
      });
    }
    const form = document.getElementById('qa-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      document.getElementById('chat-box').style.display = 'block';
      document.getElementById('user-question').textContent = formData.get('text_prompt') || '[No text prompt]';
      document.getElementById('ocr-text').textContent = 'Processing...';
      document.getElementById('card-stack').innerHTML = '';
      // Show spinner while waiting
      let spinner = document.createElement('div');
      spinner.id = 'ai-spinner';
      spinner.innerHTML = `<svg width='32' height='32' viewBox='0 0 50 50'><circle cx='25' cy='25' r='20' fill='none' stroke='#1976d2' stroke-width='5' stroke-linecap='round' stroke-dasharray='31.4 31.4' transform='rotate(-90 25 25)'><animateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='1s' repeatCount='indefinite'/></circle></svg><span style='margin-left:10px;color:#1976d2;font-weight:500;'>AI is thinking...</span>`;
      document.getElementById('card-stack').appendChild(spinner);
      try {
        const res = await fetch('/', { method: 'POST', body: formData });
        const data = await res.json();
        document.getElementById('ocr-text').textContent = data.context ? 'Context: ' + data.context : '';
        document.getElementById('card-stack').innerHTML = '';
        if (data.answer) {
          const steps = splitSteps(data.answer);
          showCards(steps);
        } else {
          document.getElementById('card-stack').innerHTML = '<div style="color:#888;">No answer.</div>';
        }
        document.getElementById('history').innerHTML = data.history_html || '';
      } catch (err) {
        document.getElementById('card-stack').innerHTML = '<div style="color:#d32f2f;">An error occurred. Please try again.</div>';
      }
    };
  </script>
</body>
</html>
'''

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

@app.route('/', methods=['GET'])
def home():
    return render_template_string(HTML)

@app.route('/', methods=['POST'])
def upload_multimodal():
    context_parts = []
    # Text prompt
    text_prompt = request.form.get('text_prompt', '').strip()
    if text_prompt:
        context_parts.append(f"Text: {text_prompt}")
        add_question_to_pdf_kb(text_prompt)
    # Image OCR
    if 'image' in request.files and request.files['image'].filename:
        image = Image.open(request.files['image'].stream)
        ocr_text = pytesseract.image_to_string(image)
        if ocr_text.strip():
            context_parts.append(f"Image OCR: {ocr_text.strip()}")
    # PDF Document
    if 'document' in request.files and request.files['document'].filename:
        pdf_file = request.files['document']
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        pdf_text = " ".join(page.extract_text() or '' for page in pdf_reader.pages)
        if pdf_text.strip():
            context_parts.append(f"PDF: {pdf_text.strip()}")
    # Voice (speech-to-text)
    if 'voice' in request.files and request.files['voice'].filename:
        recognizer = sr.Recognizer()
        audio_file = request.files['voice']
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            with sr.AudioFile(temp_audio.name) as source:
                audio = recognizer.record(source)
                try:
                    voice_text = recognizer.recognize_google(audio)
                    if voice_text.strip():
                        context_parts.append(f"Voice: {voice_text.strip()}")
                except Exception as e:
                    context_parts.append(f"Voice: [Could not transcribe audio: {e}]")
            os.remove(temp_audio.name)
    # Combine all context
    context = "\n".join(context_parts)
    # Maintain chat history in session
    if 'history' not in session:
        session['history'] = []
    session['history'].append({'user': context})
    # Build prompt with history
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
    # Add Q&A to PDF KB (after getting answer)
    if text_prompt:
        add_qa_to_pdf_kb(text_prompt, answer)
    # Render chat history as HTML
    history_html = "<b>Chat History:</b><br>" + "<br>".join([
        f"<b>You:</b> {h['user']}<br><b>AI:</b> {h.get('ai','')}" for h in session['history']
    ])
    return jsonify({'context': context, 'answer': answer, 'history_html': history_html})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
