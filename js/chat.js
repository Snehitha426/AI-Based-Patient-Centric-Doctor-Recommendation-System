// ===== CONVERSATIONAL CHAT MODULE =====

const CHAT_STEPS = [
    {
        key: 'location',
        bot: "👋 Hi there! I'm **DocAI**, your personal health assistant.\n\nTo find the best doctor for you, let's start with your **city or location**?",
        placeholder: 'e.g. Hyderabad, Mumbai, Delhi…',
        type: 'text',
        quickReplies: ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai'],
    },
    {
        key: 'specialization',
        bot: "Great! 🌍 Now, which type of **doctor or specialist** do you need?",
        placeholder: 'e.g. Cardiologist, Dermatologist…',
        type: 'text',
        quickReplies: ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Physician', 'Gynecologist', 'Orthopedist'],
    },
    {
        key: 'appointmentType',
        bot: "Do you prefer an **online** or **offline** consultation? Or both?",
        placeholder: 'Online / Offline / Both',
        type: 'text',
        quickReplies: ['Online', 'Offline', 'Both'],
    },
    {
        key: 'experience',
        bot: "What is your **preferred minimum experience** for the doctor?",
        placeholder: 'e.g. 5+ years, Any',
        type: 'text',
        quickReplies: ['Any', '2+ years', '5+ years', '10+ years', '15+ years'],
    },
    {
        key: 'rating',
        bot: "What's the **minimum rating** you'd accept? Use the slider below 👇",
        placeholder: '',
        type: 'slider',
        quickReplies: [],
    },
    {
        key: 'education',
        bot: "Any preference for the **doctor's education / qualification**?",
        placeholder: 'e.g. MBBS, MD, Any',
        type: 'text',
        quickReplies: ['Any', 'MBBS', 'MD', 'MS', 'DM (Super Specialist)'],
    },
    {
        key: 'budget',
        bot: "What's your **consultation fee range**?",
        placeholder: 'e.g. Under ₹500, ₹500–₹1000',
        type: 'text',
        quickReplies: ['Under ₹500', '₹500–₹1000', '₹1000–₹2000', '₹2000+'],
    },
    {
        key: 'name',
        bot: "Almost there! 😊 What's your **name**?",
        placeholder: 'Your full name',
        type: 'text',
        quickReplies: [],
    },
    {
        key: 'email',
        bot: "And your **email address**? We'll send the recommendations there too.",
        placeholder: 'you@email.com',
        type: 'email',
        quickReplies: [],
    },
];

let chatData = {};
let currentStep = 0;
let isBotTyping = false;

function initChat() {
    chatData = {};
    currentStep = 0;
    const messagesEl = document.getElementById('chatMessages');
    messagesEl.innerHTML = '';
    document.getElementById('quickReplies').innerHTML = '';
    document.getElementById('chatInput').value = '';
    document.getElementById('sliderWrap').classList.add('hidden');
    askStep(0);
}

function askStep(index) {
    if (index >= CHAT_STEPS.length) {
        finishChat();
        return;
    }

    const step = CHAT_STEPS[index];
    showTyping();

    setTimeout(() => {
        removeTyping();
        addBotMessage(step.bot);

        // Quick replies
        const qr = document.getElementById('quickReplies');
        qr.innerHTML = '';
        (step.quickReplies || []).forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply';
            btn.textContent = reply;
            btn.onclick = () => {
                handleUserInput(reply);
            };
            qr.appendChild(btn);
        });

        // Slider
        const sliderWrap = document.getElementById('sliderWrap');
        if (step.type === 'slider') {
            sliderWrap.classList.remove('hidden');
            document.getElementById('chatInput').placeholder = 'Or type a value (1–5)';
        } else {
            sliderWrap.classList.add('hidden');
            document.getElementById('chatInput').placeholder = step.placeholder || 'Type your answer…';
            document.getElementById('chatInput').type = step.type === 'email' ? 'email' : 'text';
        }

        document.getElementById('chatInput').focus();
    }, 900);
}

function handleUserInput(value) {
    if (!value || value.trim() === '') return;

    const step = CHAT_STEPS[currentStep];

    // Validate email
    if (step.type === 'email' && !validateEmail(value.trim())) {
        addBotMessage('⚠️ Please enter a valid email address like `you@email.com`.');
        return;
    }

    addUserMessage(value.trim());

    // Special handling for slider
    if (step.type === 'slider') {
        const sliderVal = document.getElementById('ratingSlider').value;
        chatData['rating'] = isNaN(parseFloat(value)) ? sliderVal : value;
    } else {
        chatData[step.key] = value.trim();
    }

    document.getElementById('chatInput').value = '';
    document.getElementById('quickReplies').innerHTML = '';

    currentStep++;
    askStep(currentStep);
}

function finishChat() {
    showTyping();
    setTimeout(() => {
        removeTyping();
        addBotMessage(`🎉 Perfect, **${chatData.name || 'there'}**! I have everything I need.\n\nClick **Find Doctors** below to get your personalized recommendations!`);

        // Show find doctors button
        const qr = document.getElementById('quickReplies');
        qr.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.style.marginTop = '8px';
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Find Doctors';
        btn.onclick = () => submitPatientData(chatData);
        qr.appendChild(btn);
    }, 800);
}

function addBotMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg bot';
    // Convert markdown-like **bold** to <strong>
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
    el.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble">${html}</div>
  `;
    document.getElementById('chatMessages').appendChild(el);
    scrollChatBottom();
}

function addUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
    document.getElementById('chatMessages').appendChild(el);
    scrollChatBottom();
}

function showTyping() {
    if (isBotTyping) return;
    isBotTyping = true;
    const el = document.createElement('div');
    el.className = 'msg bot typing-msg';
    el.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
    document.getElementById('chatMessages').appendChild(el);
    scrollChatBottom();
}

function removeTyping() {
    isBotTyping = false;
    document.querySelector('.typing-msg')?.remove();
}

function scrollChatBottom() {
    const el = document.getElementById('chatMessages');
    el.scrollTop = el.scrollHeight;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Event listeners for chat
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const ratingSlider = document.getElementById('ratingSlider');

    sendBtn.addEventListener('click', () => {
        const step = CHAT_STEPS[currentStep];
        const val = step && step.type === 'slider'
            ? document.getElementById('ratingSlider').value
            : chatInput.value;
        handleUserInput(val);
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const step = CHAT_STEPS[currentStep];
            const val = step && step.type === 'slider'
                ? document.getElementById('ratingSlider').value
                : chatInput.value;
            handleUserInput(val);
        }
    });

    ratingSlider.addEventListener('input', () => {
        document.getElementById('sliderValue').textContent = ratingSlider.value;
    });
});
