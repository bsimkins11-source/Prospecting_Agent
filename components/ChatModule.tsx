"use client";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatModuleProps {
  companyData: any;
  martechStack: any;
  technologyCategories: any;
  newsArticles: any[];
}

export default function ChatModule({ 
  companyData, 
  martechStack, 
  technologyCategories, 
  newsArticles 
}: ChatModuleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateInitialAnalysis = async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setIsInitialized(true);

    try {
      const response = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyData,
          martechStack,
          technologyCategories,
          newsArticles
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error, data.details);
        setMessages([
          {
            id: '1',
            type: 'assistant',
            content: `Sorry, I encountered an error: ${data.error}. ${data.details || ''}`,
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages([
          {
            id: '1',
            type: 'assistant',
            content: data.analysis || 'Analysis could not be generated.',
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating initial analysis:', error);
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: 'Sorry, I encountered an error generating the initial analysis. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          companyData,
          martechStack,
          technologyCategories,
          newsArticles,
          conversationHistory: messages
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response || 'I couldn\'t generate a response. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      height: "600px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
            🤖 AI Analysis & Chat
          </h3>
          {!isInitialized && (
            <button
              onClick={generateInitialAnalysis}
              disabled={isLoading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {messages.length === 0 && !isLoading && (
          <div style={{
            textAlign: "center",
            color: "#6b7280",
            padding: "2rem"
          }}>
            <p>Click "Start Analysis" to begin the AI analysis of {companyData?.name || 'this company'}.</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
              I'll analyze the tech stack, MarTech data, and recent news to provide insights on how Transparent Partners can help.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "0.75rem 1rem",
                borderRadius: message.type === 'user' ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: message.type === 'user' ? "#3b82f6" : "#f3f4f6",
                color: message.type === 'user' ? "white" : "#1f2937",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap"
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "18px 18px 18px 4px",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              fontSize: "0.875rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid #6b7280",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "1rem",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the company, tech stack, or how TP can help..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "0.875rem",
              outline: "none",
              backgroundColor: isLoading ? "#f3f4f6" : "white"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: (!input.trim() || isLoading) ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer"
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
