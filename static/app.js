function splitSteps(answer) {
  // Strictly split by 'Step X:'
  let steps = answer.match(/Step \d+:.*?(?=(Step \d+:|$))/gs);
  if (!steps) {
    steps = answer.split(/\n- |\n• |\n/).filter(s => s.trim().length > 0);
  }
  if (!steps || steps.length === 1) {
    steps = answer.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  }
  return steps.map(s => s.replace(/^Step \d+:/, '').trim());
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

function scrollChatToBottom() {
  const chatBox = document.getElementById('chat-box');
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderChatHistory(html) {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = html;
  scrollChatToBottom();
}

function showSpinner(show) {
  document.getElementById('ai-spinner').style.display = show ? 'flex' : 'none';
}

const form = document.getElementById('qa-form');
form.onsubmit = async (e) => {
  e.preventDefault();
  showSpinner(true);
  const formData = new FormData(form);
  const userMsg = formData.get('text_prompt') || '[No text prompt]';
  // Optimistically add user message
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML += `<div class='chat-row user'><div class='avatar user-avatar'>🧑</div><div class='bubble user-bubble'>${userMsg}</div></div>`;
  scrollChatToBottom();
  try {
    const res = await fetch('/', { method: 'POST', body: formData });
    const data = await res.json();
    showSpinner(false);
    if (data.error) {
      chatBox.innerHTML += `<div class='chat-row ai'><div class='avatar ai-avatar'>🤖</div><div class='bubble ai-bubble' style='color:#d32f2f;'>${data.error}</div></div>`;
      scrollChatToBottom();
      return;
    }
    renderChatHistory(data.history_html);
  } catch (err) {
    showSpinner(false);
    chatBox.innerHTML += `<div class='chat-row ai'><div class='avatar ai-avatar'>🤖</div><div class='bubble ai-bubble' style='color:#d32f2f;'>An error occurred. Please try again.</div></div>`;
    scrollChatToBottom();
  }
};

document.getElementById('reset-btn').onclick = async () => {
  showSpinner(true);
  try {
    await fetch('/reset', { method: 'POST' });
    document.getElementById('chat-box').innerHTML = '';
    form.reset();
  } finally {
    showSpinner(false);
  }
};

// Optional: Enter key submits, Shift+Enter for newline
const textInput = document.getElementById('text_prompt');
textInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit', {cancelable:true}));
  }
});
