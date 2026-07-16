'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Link as LinkIcon, Plus, Search, Brain, X, Loader2, Compass, ArrowRight, Image as ImageIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import Dropzone from '../components/Dropzone';
import Logo from '../components/Logo';
import CardGrid from '../components/CardGrid';
import ChatSidebar from '../components/ChatSidebar';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const FILTER_TABS = [
  { id: 'all', label: 'All Items', icon: Compass },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'links', label: 'Links', icon: LinkIcon },
];

export default function Home() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isScrapingLink, setIsScrapingLink] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const heroRef = useRef(null);
  const headerRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load items from database once session is available
  useEffect(() => {
    if (!session) return;
    const fetchItems = async () => {
      try {
        const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/items', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = data.items.map(item => ({
            id: item.id,
            ocr_text: item.document,
            document: item.document,
            metadata: item.metadata
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch items on mount:', err);
      }
    };
    fetchItems();
  }, [session]);

  // GSAP hero entrance animation
  useEffect(() => {
    if (!headerRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current.querySelectorAll('.hero-anim'),
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
    );
  }, []);

  const handleUploadSuccess = (item) => {
    setItems((prevItems) => [item, ...prevItems]);
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkInput.trim() || isScrapingLink || !session) return;
    setIsScrapingLink(true);
    try {
      const tempId = `link-${Date.now()}`;
      const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: tempId, url: linkInput }),
      });
      if (!response.ok) throw new Error('Failed to process web link');
      const data = await response.json();
      setItems((prevItems) => [data, ...prevItems]);
      setLinkInput('');
    } catch (err) {
      alert(err.message || 'Failed to index link');
    } finally {
      setIsScrapingLink(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !session) return;
    setIsSearching(true);
    try {
      const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ query: searchQuery, limit: 12 }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const mappedItems = data.results.map(res => ({
            id: res.id,
            ocr_text: res.document,
            document: res.document,
            metadata: res.metadata,
          }));
          setItems(mappedItems);
          setIsSearchMode(true);
        } else {
          setItems([]);
          setIsSearchMode(true);
        }
      }
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearchQuery('');
    setIsSearchMode(false);
    if (!session) return;
    try {
      const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/items', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.items.map(item => ({
          id: item.id,
          ocr_text: item.document,
          document: item.document,
          metadata: item.metadata
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch items on clear:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8892b0',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Logo size={60} />
          <p style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.1em' }}>LOADING SESSION...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalCount = items.length;
  const ssCount = items.filter(i => i.metadata?.type === 'screenshot').length;
  const linkCount = items.filter(i => i.metadata?.type === 'link').length;

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* ── Fixed Top Header ──────────────────────────────────────── */}
      <header
        ref={headerRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: '0 2rem',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(240,242,248,0.80)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 2px 20px rgba(108,99,255,0.06)',
        }}
      >
        {/* Gradient bar */}
        <div className="hero-gradient-bar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />

        {/* Logo */}
        <div className="hero-anim" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Logo size={42} />
          <div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.35rem',
              background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 50%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>Recall AI</h1>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#8892b0', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.1rem' }}>
              Multi-Modal Hub
            </p>
          </div>
        </div>

        {/* Stats pills */}
        <div className="hero-anim" style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { label: 'Total', count: totalCount, color: '#6C63FF' },
            { label: 'Screenshots', count: ssCount, color: '#8B5CF6' },
            { label: 'Links', count: linkCount, color: '#00A389' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(255,255,255,0.90)',
              boxShadow: '2px 2px 6px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: stat.color, fontFamily: "'Outfit', sans-serif" }}>
                {stat.count}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#8892b0', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Header Actions */}
        <div className="hero-anim" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.button
            className="btn-primary"
            onClick={() => setIsChatOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Brain style={{ width: 16, height: 16 }} />
            <span>Assistant</span>
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight style={{ width: 14, height: 14 }} />
            </motion.div>
          </motion.button>

          <motion.button
            onClick={signOut}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(220, 53, 69, 0.2)',
              background: 'rgba(255,255,255,0.7)',
              color: '#dc3545',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '2px 2px 8px rgba(200,203,220,0.3)',
            }}
          >
            <Lock style={{ width: 14, height: 14 }} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>

        {/* ── Hero Section ─────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.20)',
              marginBottom: '1.25rem',
              boxShadow: '2px 2px 8px rgba(200,203,220,0.3)',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6C63FF', animation: 'pulse-glow 2s infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6C63FF', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.06em' }}>
                POWERED BY MULTI-MODAL VISION ENGINE
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              lineHeight: 1.15,
              color: '#1e1b4b',
              marginBottom: '1rem',
            }}>
              Your Personal{' '}
              <span className="gradient-text">Knowledge Hub</span>
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              fontFamily: "'Inter', sans-serif",
              maxWidth: '520px',
              margin: '0 auto 2rem',
              lineHeight: 1.7,
            }}>
              Drop screenshots, paste links — let the system extract, embed, and make your information{' '}
              <strong style={{ color: '#6C63FF', fontWeight: 700 }}>instantly searchable</strong>.
            </p>
          </motion.div>

          {/* Quick stats bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              display: 'inline-flex',
              gap: '0',
              borderRadius: '18px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(255,255,255,0.95)',
              boxShadow: '4px 4px 16px rgba(200,203,220,0.5), -4px -4px 12px rgba(255,255,255,0.9)',
            }}
          >
            {[
              { icon: Brain, label: 'Semantic Search', sub: 'Indexed' },
              { icon: Sparkles, label: 'Text Parser', sub: 'OCR Layer' },
              { icon: Lock, label: 'Private Storage', sub: 'Local Database' },
            ].map((feat, i) => {
              const IconComp = feat.icon;
              return (
                <div key={feat.label} style={{
                  padding: '0.875rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRight: i < 2 ? '1px solid rgba(108,99,255,0.08)' : 'none',
                }}>
                  <div style={{ marginBottom: '0.35rem' }}>
                    <IconComp style={{ width: 18, height: 18, color: '#6C63FF' }} />
                  </div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: '#1e1b4b' }}>{feat.label}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', color: '#8892b0' }}>{feat.sub}</div>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* ── Ingest Panel ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Screenshot Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              style={{
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.90)',
                padding: '1.5rem',
                boxShadow: '5px 5px 16px rgba(200,203,220,0.45), -5px -5px 16px rgba(255,255,255,0.85)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifycontent: 'center',
                  boxShadow: '0 3px 10px rgba(108,99,255,0.30)',
                }}>
                  <Sparkles style={{ width: 13, height: 13, color: 'white' }} />
                </div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#1e1b4b' }}>
                  Ingest Screenshot
                </h2>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.6rem', fontWeight: 700, color: '#6C63FF',
                  background: 'rgba(108,99,255,0.10)',
                  border: '1px solid rgba(108,99,255,0.20)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  fontFamily: "'Outfit', sans-serif",
                }}>Text Extraction</span>
              </div>
              <Dropzone onUploadSuccess={handleUploadSuccess} />
            </motion.div>

            {/* Link Ingest + How it works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {/* Link Card */}
              <div style={{
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.90)',
                padding: '1.5rem',
                boxShadow: '5px 5px 16px rgba(200,203,220,0.45), -5px -5px 16px rgba(255,255,255,0.85)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '8px',
                    background: 'linear-gradient(135deg, #00C9A7, #00B4D8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(0,201,167,0.25)',
                  }}>
                    <LinkIcon style={{ width: 13, height: 13, color: 'white' }} />
                  </div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#1e1b4b' }}>
                    Ingest Web Link
                  </h2>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.6rem', fontWeight: 700, color: '#00A389',
                    background: 'rgba(0,201,167,0.10)',
                    border: '1px solid rgba(0,201,167,0.25)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    fontFamily: "'Outfit', sans-serif",
                  }}>Web Scraper</span>
                </div>

                <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="url"
                      required
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://example.com/article..."
                      className="input-glass"
                      style={{ paddingLeft: '2.5rem' }}
                      disabled={isScrapingLink}
                    />
                    <LinkIcon style={{ position: 'absolute', left: '0.875rem', width: 15, height: 15, color: '#8892b0', pointerEvents: 'none' }} />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isScrapingLink}
                    className="btn-teal"
                    whileHover={{ scale: isScrapingLink ? 1 : 1.02 }}
                    whileTap={{ scale: isScrapingLink ? 1 : 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: isScrapingLink ? 0.7 : 1,
                    }}
                  >
                    {isScrapingLink ? (
                      <>
                        <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                        Scraping Content...
                      </>
                    ) : (
                      <>
                        <Plus style={{ width: 15, height: 15 }} />
                        Add Web Link
                      </>
                    )}
                  </motion.button>
                </form>
              </div>

              {/* How it works card */}
              <div style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(108,99,255,0.07) 0%, rgba(0,201,167,0.05) 100%)',
                border: '1px solid rgba(108,99,255,0.15)',
                padding: '1.125rem 1.25rem',
                flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Compass style={{ width: 16, height: 16, color: '#6C63FF' }} />
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.825rem', color: '#1e1b4b' }}>
                    How it works
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {[
                    { step: '1', text: 'Drop screenshot → Vision parser extracts text' },
                    { step: '2', text: 'Paste URL → Scraper fetches web content' },
                    { step: '3', text: 'Text is embedded into ChromaDB vector store' },
                    { step: '4', text: 'Ask Assistant — Semantic search retrieves & answers' },
                  ].map(({ step, text }) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 800, color: 'white', fontFamily: "'Outfit', sans-serif",
                      }}>{step}</span>
                      <p style={{ fontSize: '0.75rem', color: '#4c5178', fontFamily: "'Inter', sans-serif", lineHeight: 1.45 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="section-divider" style={{ margin: '0 0 2.5rem' }} />

        {/* ── Search + Filters Row ─────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ flex: '1', minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Semantic search — describe what you're looking for..."
                className="input-glass"
                style={{ paddingLeft: '2.75rem', paddingRight: isSearchMode ? '6.5rem' : '5rem' }}
              />
              <Search style={{ position: 'absolute', left: '0.9rem', width: 16, height: 16, color: '#8892b0', pointerEvents: 'none' }} />

              {isSearchMode && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: '4.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#6C63FF',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <X style={{ width: 12, height: 12 }} /> Clear
                </button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                  color: 'white',
                  border: 'none',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 2px 10px rgba(108,99,255,0.30)',
                }}
              >
                {isSearching ? (
                  <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Search'
                )}
              </motion.button>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                display: 'flex',
                gap: '0.25rem',
                padding: '0.35rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.70)',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: '3px 3px 10px rgba(200,203,220,0.45), -3px -3px 10px rgba(255,255,255,0.85)',
              }}
            >
              {FILTER_TABS.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
                    whileHover={{ scale: filter === tab.id ? 1 : 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <IconComponent style={{ width: 14, height: 14 }} />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Search mode banner */}
          <AnimatePresence>
            {isSearchMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: '0.875rem',
                  padding: '0.625rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: '#6C63FF',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                Showing semantic search results for "<strong>{searchQuery}</strong>"
                <button
                  onClick={clearSearch}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#6C63FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  <X style={{ width: 12, height: 12 }} /> Back to all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Cards Grid ───────────────────────────────────────────── */}
        <section>
          <CardGrid items={items} filter={filter} />
        </section>
      </div>

      {/* ── Assistant Sidebar ─────────────────────────────────────── */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  );
}
