const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");

/* ================= Theme Toggle ================= */

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = document.getElementById('theme-icon');
    if (newTheme === 'light') {
        icon.innerHTML = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    } else {
        icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
}

// Load saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'light') {
        const icon = document.getElementById('theme-icon');
        icon.innerHTML = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    }
});

/* ================= Textarea Auto-resize ================= */

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

/* ================= Handle Enter Key ================= */

userInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendQuestion();
    }
    // Shift+Enter will naturally create a new line in textarea
});

/* ================= Utility ================= */

function addMessage(text, sender = "bot") {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    
    if (sender === "bot") {
        // Add bot icon for bot messages
        const botIcon = document.createElement("div");
        botIcon.className = "bot-icon";
        botIcon.innerHTML = `<img src="fwvlab.png" alt="Bot">`;
        
        const content = document.createElement("div");
        content.className = "message-content";
        content.innerHTML = text;
        
        div.appendChild(botIcon);
        div.appendChild(content);
    } else {
        const content = document.createElement("div");
        content.className = "message-content";
        content.innerHTML = text;
        div.appendChild(content);
    }
    
    chatBox.appendChild(div);
    
    // Smooth scroll with animation
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

function showTyping() {
    const div = document.createElement("div");
    div.className = "message bot searching";
    div.id = "typing-indicator";
    
    const botIcon = document.createElement("div");
    botIcon.className = "bot-icon";
    botIcon.innerHTML = `<img src="fwvlab.png" alt="Bot">`;
    
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    div.appendChild(botIcon);
    div.appendChild(content);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/* ================= Greetings ================= */

function isGreeting(msg) {
    return ["hi", "hello", "hey", "hola", "sup"].some(g => msg.includes(g));
}

function showSuggestions() {
    const suggestionsHTML = `
        <div class="suggestions">
            <button onclick="ask('Explain Faraday\\'s Law')">⚡ Faraday's Law</button>
            <button onclick="ask('What is displacement current')">🔌 Displacement Current</button>
            <button onclick="ask('Explain cylindrical coordinates')">📐 Cylindrical Coordinates</button>
            <button onclick="ask('Explain Gauss law')">🧲 Gauss's Law</button>
        </div>
    `;
    
    const lastMessage = chatBox.lastElementChild;
    if (lastMessage && lastMessage.classList.contains("bot")) {
        const content = lastMessage.querySelector(".message-content");
        if (content) {
            content.innerHTML += suggestionsHTML;
        }
    }
}

/* ================= Chat Init ================= */

window.onload = () => {
    addMessage("👋 Hey there! I'm your FWV Learning Assistant.");
    setTimeout(() => {
        addMessage("I can explain Fields & Waves concepts using AI and course content. What would you like to learn today?");
        setTimeout(() => {
            showSuggestions();
        }, 400);
    }, 600);
};

/* ================= User Input ================= */

function ask(question) {
    addMessage(question, "user");
    handleUserMessage(question);
}

function sendQuestion() {
    const msg = userInput.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    userInput.value = "";
    userInput.style.height = 'auto'; // Reset height after sending
    handleUserMessage(msg);
}

/* ================= Core Logic ================= */

function handleUserMessage(message) {
    const intentText = message.toLowerCase();

    // Greeting
    if (isGreeting(intentText)) {
        setTimeout(() => {
            addMessage("👋 Hello! What topic would you like to explore?");
            setTimeout(() => {
                showSuggestions();
            }, 400);
        }, 600);
        return;
    }

    // Normalize short keyword queries
    let finalQuery = message;
    if (
        !intentText.startsWith("explain") &&
        !intentText.startsWith("what is") &&
        message.split(" ").length <= 4
    ) {
        finalQuery = "Explain " + message;
    }

    askGemini(finalQuery);
}

/* ================= Gemini RAG Call ================= */

async function askGemini(question) {
    showTyping();

    try {
        const response = await fetch("http://127.0.0.1:8000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: question })
        });

        const data = await response.json();
        
        // Remove typing indicator
        setTimeout(() => {
            removeTyping();

            if (!data.answer) {
                addMessage("❌ I couldn't generate an explanation for that. Try another concept!");
                setTimeout(() => {
                    showSuggestions();
                }, 400);
                return;
            }

            // Add the answer
            addMessage(`<pre>${data.answer}</pre>`);
            
            // Ask for more
            setTimeout(() => {
                addMessage("Would you like to explore another topic?");
                setTimeout(() => {
                    showSuggestions();
                }, 400);
            }, 800);
        }, 800);

    } catch (error) {
        setTimeout(() => {
            removeTyping();
            addMessage("⚠️ Server error. Please try again later.", "error-message");
        }, 800);
    }
}