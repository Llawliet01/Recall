'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, User, ExternalLink, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function ChatSidebar({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Call the RAG Chat FastAPI endpoint
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          history: messages.slice(-6) // Send recent context history
        })
      });

      if (!response.ok) {
        throw new Error("API failed to generate a response");
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || []
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error: Failed to communicate with KnoSnap AI server. Please make sure the FastAPI backend is running locally at http://localhost:8000.",
        sources: []
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-full md:w-96 z-40 glass-panel shadow-2xl flex flex-col border-l border-white/10 transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-lg text-white">KnoSnap AI Brain</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20"
      >
        {messages.length === 0 ? (
          <div className="text-center py-20 px-4 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-indigo-500/50" />
            <p className="font-semibold text-sm">Ask your personal AI Brain</p>
            <p className="text-xs text-gray-500 mt-1">
              "What error did I capture in my terminal screenshot?" or "Find my recipes with pasta."
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index}
                className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}

                  {/* Render Sources */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sources Cited:</span>
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          {src.type === 'screenshot' ? (
                            <ImageIcon className="w-3.5 h-3.5" />
                          ) : (
                            <LinkIcon className="w-3.5 h-3.5" />
                          )}
                          <span className="truncate max-w-[150px]">{src.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center space-x-3 text-sm text-gray-400 pl-2">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            <span>AI Brain is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-white/5 bg-slate-950/40"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="Query your saved brain..."
            className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-gray-600 text-white rounded-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
