
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2 } from "lucide-react";
import "./Chatbot.css";

const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );
const REQUEST_TIMEOUT_MS = 90_000;

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi! 👋 I'm PennyWise AI, your personal finance assistant. I can help you create budgets, manage expenses, build savings, and improve your financial habits. How can I help you today?",
};

const QUICK_PROMPTS = [
  "How can I save money?",
  "Create a monthly budget",
  "Explain the 50/30/20 rule",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = async (text = input) => {
    const message = text.trim();

    if (!message || loading) return;

    setError("");

    const updatedMessages = [
      ...messages,
      { role: "user", text: message },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const history = messages
        .filter(
          (item) =>
            ["user", "assistant", "model"].includes(item.role) &&
            typeof item.text === "string"
        )
        .slice(-10)
        .map((item) => ({
          role:
            item.role === "assistant" ? "model" : item.role,
          text: item.text,
        }));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Server error (${response.status}). Please try again.`
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.reply.trim(),
        },
      ]);
    } catch (err) {
      let errorMessage;

      if (err.name === "AbortError") {
        if (!timedOut) return;

        errorMessage =
          "Gemini did not respond within 90 seconds. Check the backend terminal for API errors and verify the server has internet access.";
      } else if (err instanceof TypeError) {
        errorMessage =
          "Cannot connect to the backend. Make sure your server is running on port 5000.";
      } else {
        errorMessage =
          err.message || "Something went wrong. Please try again.";
      }

      setError(errorMessage);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `⚠️ ${errorMessage}`,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    if (loading) {
      abortControllerRef.current?.abort();
    }

    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    setLoading(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      {/* Floating chatbot button */}
      {!isOpen && (
        <button
          type="button"
          className="pw-chat-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open PennyWise AI assistant"
          title="Chat with PennyWise AI"
        >
          <MessageCircle size={25} />
          <span className="pw-chat-toggle-dot" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <section
          className="pw-chat-window"
          aria-label="PennyWise AI chat"
        >
          {/* Header */}
          <header className="pw-chat-header">
            <div className="pw-chat-brand">
              <div className="pw-chat-brand-icon">
                <Bot size={23} />
              </div>

              <div>
                <h2>PennyWise AI</h2>
                <p>
                  <span className="pw-online-dot" />
                  Your financial assistant
                </p>
              </div>
            </div>

            <div className="pw-chat-header-actions">
              <button
                type="button"
                onClick={clearChat}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="pw-chat-icon-button"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
                className="pw-chat-icon-button"
              >
                <X size={21} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="pw-chat-messages">
            <div className="pw-chat-date">
              Your personal finance companion
            </div>

            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${index}-${message.role}`}
                  className={`pw-chat-message ${
                    isUser ? "pw-user-message" : "pw-ai-message"
                  }`}
                >
                  <div className="pw-chat-avatar">
                    {isUser ? (
                      <User size={17} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>

                  <div className="pw-chat-bubble">
                    <p>{message.text}</p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="pw-chat-message pw-ai-message">
                <div className="pw-chat-avatar">
                  <Bot size={18} />
                </div>

                <div
                  className="pw-chat-bubble pw-thinking"
                  aria-live="polite"
                >
                  <span>Thinking</span>
                  <span className="pw-thinking-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && !loading && (
            <div className="pw-chat-suggestions">
              <span>Try asking</span>

              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Error status */}
          {error && (
            <div className="pw-chat-error" role="alert">
              {error}
            </div>
          )}

          {/* Input */}
          <form
            className="pw-chat-input-area"
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your finances..."
              maxLength={4000}
              disabled={loading}
              aria-label="Type your message"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              title="Send message"
              className="pw-chat-send"
            >
              <Send size={18} />
            </button>
          </form>

          <footer className="pw-chat-footer">
            PennyWise AI can make mistakes. Verify important financial decisions.
          </footer>
        </section>
      )}
    </>
  );
}
