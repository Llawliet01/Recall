'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ExternalLink, Image as ImageIcon, Link as LinkIcon, X, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

import { useAuth } from '../context/AuthContext';

const SUGGESTED_QUERIES = [
  'What error did I capture last?',
  'Summarize my saved articles',
  'Find notes about React hooks',
  'What links did I save today?',
];

export default function ChatSidebar({ isOpen, onClose }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim() || isSending || !session) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          question: query,
          history: messages.slice(-6),
        }),
      });

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Unable to reach Recall AI Assistant. Please ensure the backend is active.',
        sources: [],
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(30,27,75,0.20)',
              backdropFilter: 'blur(4px)',
              zIndex: 39,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '420px',
          maxWidth: '100vw',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(240,242,248,0.85)',
          backdropFilter: 'blur(32px) saturate(200%)',
          borderLeft: '1px solid rgba(255,255,255,0.80)',
          boxShadow: '-8px 0 48px rgba(108,99,255,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(108,99,255,0.10)',
          background: 'rgba(255,255,255,0.50)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated gradient bar at top */}
          <div className="hero-gradient-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifySpaceBetween: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {/* Animated brain orb */}
              <Logo size={44} />

              <div>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}>Recall AI Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.15rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C9A7', animation: 'pulse-glow 2s infinite' }} />
                  <span style={{ fontSize: '0.7rem', color: '#00C9A7', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    Semantic Index · Connected
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '0.4rem', borderRadius: '10px', display: 'flex' }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              {/* Neural network visual */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 1.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,201,167,0.10))',
                  border: '2px solid rgba(108,99,255,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 12px rgba(200,203,220,0.5), -4px -4px 12px rgba(255,255,255,0.9)',
                }}
              >
                <Sparkles style={{ width: 36, height: 36, color: '#6C63FF' }} />
              </motion.div>

              <p style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                color: '#1e1b4b',
                marginBottom: '0.4rem',
              }}>Ask your Knowledge Assistant anything</p>
              <p style={{ fontSize: '0.78rem', color: '#8892b0', fontFamily: "'Inter', sans-serif", marginBottom: '1.5rem' }}>
                Searches across all your saved screenshots and bookmarks
              </p>

              {/* Suggested queries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUGGESTED_QUERIES.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSend(q)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.70)',
                      border: '1px solid rgba(255,255,255,0.90)',
                      boxShadow: '2px 2px 6px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.8)',
                      color: '#4c5178',
                      fontSize: '0.78rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {/* Role label */}
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: '#8892b0',
                      marginBottom: '0.3rem',
                      fontFamily: "'Outfit', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {isUser ? 'You' : 'Assistant'}
                    </span>

                    {/* Message bubble */}
                    <div style={{
                      maxWidth: '88%',
                      padding: '0.875rem 1.1rem',
                      borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      fontFamily: "'Inter', sans-serif",
                      ...(isUser ? {
                        background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(108,99,255,0.30)',
                      } : {
                        background: 'rgba(255,255,255,0.80)',
                        border: '1px solid rgba(255,255,255,0.95)',
                        color: '#1e1b4b',
                        boxShadow: '3px 3px 10px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.9)',
                      }),
                    }}>
                      {msg.content}

                      {/* Sources */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(108,99,255,0.12)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                            Sources cited:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: 'rgba(108,99,255,0.10)',
                                  border: '1px solid rgba(108,99,255,0.25)',
                                  color: '#6C63FF',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {src.type === 'screenshot' ? (
                                  <ImageIcon style={{ width: 10, height: 10 }} />
                                ) : (
                                  <LinkIcon style={{ width: 10, height: 10 }} />
                                )}
                                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {src.title}
                                </span>
                                <ExternalLink style={{ width: 9, height: 9 }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '20px 20px 20px 6px',
                  background: 'rgba(255,255,255,0.80)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: '3px 3px 10px rgba(200,203,220,0.4)',
                }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#8892b0', fontFamily: "'Inter', sans-serif" }}>
                  Searching knowledge base...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input ── */}
        <div style={{
          padding: '1rem 1.25rem 1.5rem',
          borderTop: '1px solid rgba(108,99,255,0.10)',
          background: 'rgba(255,255,255,0.45)',
        }}>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder="Ask anything about your saved content..."
                rows={1}
                style={{
                  width: '100%',
                  resize: 'none',
                  padding: '0.85rem 1rem',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(255,255,255,0.90)',
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(12px)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: '#1e1b4b',
                  outline: 'none',
                  boxShadow: '3px 3px 8px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.9)',
                  transition: 'all 0.2s',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(108,99,255,0.50)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(108,99,255,0.10), 3px 3px 8px rgba(200,203,220,0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.90)';
                  e.target.style.boxShadow = '3px 3px 8px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.9)';
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleSend()}
              disabled={isSending || !input.trim()}
              style={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                border: 'none',
                cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isSending || !input.trim()
                  ? 'rgba(200,203,220,0.4)'
                  : 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                boxShadow: isSending || !input.trim()
                  ? 'none'
                  : '0 4px 16px rgba(108,99,255,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isSending ? (
                <Zap style={{ width: 18, height: 18, color: '#8892b0', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ width: 18, height: 18, color: input.trim() ? 'white' : '#8892b0' }} />
              )}
            </motion.button>
          </div>
          <p style={{ fontSize: '0.65rem', color: '#8892b0', marginTop: '0.5rem', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    </>
  );
}
