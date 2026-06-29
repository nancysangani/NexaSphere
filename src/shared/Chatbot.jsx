import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import '../styles/chatbot.css';

const Chatbot = () => {
  const aiApiUrl = import.meta.env.VITE_AI_API_URL;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: aiApiUrl
        ? 'Nexa-Intelligence Online. How can I assist your journey?'
        : 'Our AI assistant is currently offline. Please reach out via the Contact page.',
    },
  ]);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const baseUrl = aiApiUrl;
      if (!baseUrl) {
        throw new Error('AI URL not configured');
      }
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      if (!response.ok) {
        throw new Error('Server returned error status');
      }
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Our AI assistant is currently offline. Please reach out via the Contact page.',
        },
      ]);
    }
  };

  return (
    <div className="ns-chatbot-wrapper">
      {!isOpen ? (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)} aria-label="Open chat">
          <div className="pulse-ring"></div>
          <MessageCircle size={24} aria-hidden="true" />
        </button>
      ) : (
        <div className="chat-window-glass">
          <div className="chat-header">
            <div className="header-status">
              <span className="status-dot"></span>
              <span>NEXA-AI</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query system..."
              aria-label="Query system"
            />
            <button onClick={handleSend} className="send-btn" aria-label="Send message">
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
