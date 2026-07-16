'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExternalLink, Image as ImageIcon, Link as LinkIcon, X, Calendar, Tag, FileText, LayoutGrid, List, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

const ITEMS_PER_FILTER = 12;

export default function CardGrid({ items, filter }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const gridRef = useRef(null);

  // Filter + limit to 10 most recent (memoized to prevent re-triggering animations on hover state change)
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (filter === 'all') return true;
        if (filter === 'screenshots') return item.metadata?.type === 'screenshot';
        if (filter === 'links') return item.metadata?.type === 'link';
        return true;
      })
      .slice(0, ITEMS_PER_FILTER);
  }, [items, filter]);

  // GSAP stagger animation whenever items change
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.anim-card');
    if (!cards.length) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        stagger: 0.06,
        ease: 'back.out(1.4)',
        clearProps: 'transform',
      }
    );
  }, [filteredItems, viewMode]);

  const getTags = (item) => {
    try { return JSON.parse(item.metadata?.tags || '[]'); }
    catch { return []; }
  };

  const formatDate = (item) => {
    const ts = item.metadata?.timestamp || item.metadata?.created_at;
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isScreenshot = (item) => item.metadata?.type === 'screenshot';

  return (
    <div style={{ width: '100%' }}>
      {/* View Mode Toggle + Item Count */}
      {filteredItems.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#8892b0',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Clock style={{ width: 12, height: 12 }} />
            Showing {filteredItems.length} most recent
          </span>

          <div style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.3rem',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.65)',
            border: '1px solid rgba(255,255,255,0.90)',
            boxShadow: '2px 2px 6px rgba(200,203,220,0.4), -2px -2px 6px rgba(255,255,255,0.8)',
          }}>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid style={{ width: 16, height: 16 }} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.55)',
            border: '2px dashed rgba(108,99,255,0.20)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: 'rgba(108,99,255,0.08)',
              border: '1.5px solid rgba(108,99,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '4px 4px 12px rgba(200,203,220,0.5), -4px -4px 12px rgba(255,255,255,0.9)',
            }}
          >
            <ImageIcon style={{ width: 32, height: 32, color: '#6C63FF' }} />
          </motion.div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1e1b4b', marginBottom: '0.4rem' }}>
            No saved items yet
          </p>
          <p style={{ fontSize: '0.825rem', color: '#8892b0', fontFamily: "'Inter', sans-serif" }}>
            Upload a screenshot or paste a link to get started.
          </p>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredItems.map((item) => {
            const ss = isScreenshot(item);
            const tags = getTags(item);
            const date = formatDate(item);

            return (
              <div
                key={item.id}
                className="anim-card glass-card"
                onClick={() => setSelectedItem(item)}
                onMouseEnter={() => setHoveredCardId(item.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  height: '270px',
                }}
              >
                {/* Card Visual Header — fills entire card */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: ss
                    ? 'linear-gradient(135deg, rgba(108,99,255,0.10) 0%, rgba(139,92,246,0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(0,201,167,0.10) 0%, rgba(0,180,216,0.06) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                }}>
                  {/* Decorative circles and icon are rendered behind the image as a fallback */}
                  <div style={{
                    position: 'absolute',
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background: ss ? 'rgba(108,99,255,0.07)' : 'rgba(0,201,167,0.07)',
                    top: -35,
                    right: -35,
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: ss ? 'rgba(139,92,246,0.05)' : 'rgba(0,180,216,0.05)',
                    bottom: -20,
                    left: -20,
                  }} />

                  {/* Fallback Icon */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: ss
                      ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)'
                      : 'linear-gradient(135deg, #00C9A7, #00B4D8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: ss
                      ? '0 8px 24px rgba(108,99,255,0.30)'
                      : '0 8px 24px rgba(0,201,167,0.25)',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {ss ? (
                      <ImageIcon style={{ width: 26, height: 26, color: 'white' }} />
                    ) : (
                      <LinkIcon style={{ width: 26, height: 26, color: 'white' }} />
                    )}
                  </div>

                  {/* Screenshot Image Preview (rendered on top) */}
                  {ss && item.metadata?.image_url && (
                    <>
                      <img
                        src={item.metadata.image_url}
                        alt={item.metadata?.title || 'Screenshot Preview'}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '12px',
                          zIndex: 2,
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          // Hide the top-left overlay badge too
                          const parent = e.target.parentElement;
                          if (parent) {
                            const badge = parent.querySelector('.screenshot-badge-overlay');
                            if (badge) badge.style.display = 'none';
                          }
                        }}
                      />
                      {/* Small visual overlay badge in top-left */}
                      <div 
                        className="screenshot-badge-overlay"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'rgba(108, 99, 255, 0.85)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(108,99,255,0.25)',
                          zIndex: 3,
                        }}
                      >
                        <ImageIcon style={{ width: 15, height: 15, color: 'white' }} />
                      </div>
                    </>
                  )}
                </div>

                {/* Content Overlay — slides up from bottom on hover */}
                <div
                  className="grid-card-content"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1rem 1.1rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: ss
                      ? 'rgba(108,99,255,0.78)'
                      : 'rgba(0,180,216,0.78)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderTop: `1px solid ${ss ? 'rgba(108,99,255,0.25)' : 'rgba(0,180,216,0.25)'}`,
                    transform: hoveredCardId === item.id ? 'translateY(0)' : 'translateY(100%)',
                    opacity: hoveredCardId === item.id ? 1 : 0,
                    pointerEvents: hoveredCardId === item.id ? 'auto' : 'none',
                    zIndex: 10,
                    transition: 'transform 0.38s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease',
                  }}
                >
                  <h3 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'white',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                  }}>
                    {item.metadata?.title || 'Untitled'}
                  </h3>

                  <p style={{
                    fontSize: '0.73rem',
                    color: 'rgba(255,255,255,0.82)',
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                  }}>
                    {item.metadata?.description || 'No description available.'}
                  </p>

                  {/* Tags + Date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {tags.slice(0, 2).map((tag, i) => (
                        <span key={i} style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: 'white',
                          background: 'rgba(255,255,255,0.18)',
                          border: '1px solid rgba(255,255,255,0.30)',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '999px',
                          fontFamily: "'Outfit', sans-serif",
                        }}>#{tag}</span>
                      ))}
                      {tags.length > 2 && (
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, alignSelf: 'center' }}>
                          +{tags.length - 2}
                        </span>
                      )}
                    </div>
                    {date && (
                      <span style={{
                        fontSize: '0.62rem',
                        color: 'rgba(255,255,255,0.70)',
                        fontFamily: "'Inter', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        whiteSpace: 'nowrap',
                      }}>
                        <Calendar style={{ width: 10, height: 10 }} />{date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filteredItems.map((item) => {
            const ss = isScreenshot(item);
            const tags = getTags(item);
            const date = formatDate(item);

            return (
              <div
                key={item.id}
                className="anim-card list-row"
                onClick={() => setSelectedItem(item)}
              >
                {/* Icon */}
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: ss
                    ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)'
                    : 'linear-gradient(135deg, #00C9A7, #00B4D8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: ss ? '0 4px 12px rgba(108,99,255,0.25)' : '0 4px 12px rgba(0,201,167,0.20)',
                }}>
                  {ss ? (
                    <ImageIcon style={{ width: 19, height: 19, color: 'white' }} />
                  ) : (
                    <LinkIcon style={{ width: 19, height: 19, color: 'white' }} />
                  )}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      fontFamily: "'Outfit', sans-serif",
                      color: ss ? '#6C63FF' : '#00A389',
                      textTransform: 'uppercase',
                    }}>
                      {ss ? 'Screenshot' : 'Link'}
                    </span>
                    {date && (
                      <span style={{ fontSize: '0.6rem', color: '#c8cbdc', fontFamily: "'Inter', sans-serif" }}>·</span>
                    )}
                    {date && (
                      <span style={{ fontSize: '0.62rem', color: '#8892b0', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar style={{ width: 9, height: 9 }} />{date}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e1b4b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '0.15rem',
                  }}>
                    {item.metadata?.title || 'Untitled'}
                  </p>
                  <p style={{
                    fontSize: '0.72rem',
                    color: '#8892b0',
                    fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.metadata?.description || item.metadata?.url || ''}
                  </p>
                </div>

                {/* Tags (right side) */}
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  {tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className={`tag ${ss ? '' : 'tag-teal'}`}>#{tag}</span>
                  ))}
                </div>

                {/* Arrow */}
                <ExternalLink style={{ width: 15, height: 15, color: '#c8cbdc', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              background: 'rgba(30,27,75,0.25)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '90vh',
                borderRadius: '28px',
                overflow: 'hidden',
                background: 'rgba(240,242,248,0.92)',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.90)',
                boxShadow: '0 32px 80px rgba(30,27,75,0.18), 0 8px 24px rgba(108,99,255,0.12)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid rgba(108,99,255,0.10)',
                background: 'rgba(255,255,255,0.60)',
                position: 'relative',
              }}>
                <div className="hero-gradient-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        background: isScreenshot(selectedItem)
                          ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)'
                          : 'linear-gradient(135deg, #00C9A7, #00B4D8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isScreenshot(selectedItem)
                          ? <ImageIcon style={{ width: 15, height: 15, color: 'white' }} />
                          : <LinkIcon style={{ width: 15, height: 15, color: 'white' }} />
                        }
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isScreenshot(selectedItem) ? '#6C63FF' : '#00A389',
                        background: isScreenshot(selectedItem) ? 'rgba(108,99,255,0.10)' : 'rgba(0,201,167,0.10)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        border: `1px solid ${isScreenshot(selectedItem) ? 'rgba(108,99,255,0.20)' : 'rgba(0,201,167,0.20)'}`,
                      }}>
                        {isScreenshot(selectedItem) ? 'Screenshot' : 'Bookmark Link'}
                      </span>
                    </div>
                    <h2 style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      color: '#1e1b4b',
                      lineHeight: 1.3,
                    }}>
                      {selectedItem.metadata?.title || 'Untitled'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="btn-ghost"
                    style={{ padding: '0.45rem', borderRadius: '12px', display: 'flex', flexShrink: 0 }}
                  >
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Knowledge Summary */}
                <div>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8892b0', fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', display: 'inline-block' }} />
                    Knowledge Summary
                  </h4>
                  <div style={{
                    padding: '1rem 1.125rem',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '3px 3px 10px rgba(200,203,220,0.35), -2px -2px 6px rgba(255,255,255,0.9)',
                    fontSize: '0.875rem',
                    color: '#4c5178',
                    lineHeight: 1.65,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {selectedItem.metadata?.description || 'No summary available.'}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8892b0', fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C9A7', display: 'inline-block' }} />
                    Source Reference
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '3px 3px 8px rgba(200,203,220,0.35)',
                  }}>
                    {isScreenshot(selectedItem) ? (
                      <ImageIcon style={{ width: 18, height: 18, color: '#6C63FF', flexShrink: 0 }} />
                    ) : (
                      <LinkIcon style={{ width: 18, height: 18, color: '#00A389', flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '0.8rem', color: '#4c5178', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif" }}>
                      {isScreenshot(selectedItem) ? selectedItem.metadata?.image_url : selectedItem.metadata?.url}
                    </span>
                    <a
                      href={isScreenshot(selectedItem) ? selectedItem.metadata?.image_url : selectedItem.metadata?.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '0.4rem',
                        borderRadius: '10px',
                        background: 'rgba(108,99,255,0.10)',
                        border: '1px solid rgba(108,99,255,0.20)',
                        display: 'flex',
                        color: '#6C63FF',
                        flexShrink: 0,
                      }}
                    >
                      <ExternalLink style={{ width: 14, height: 14 }} />
                    </a>
                  </div>
                </div>

                {/* OCR / Scraped Text */}
                <div>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8892b0', fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                    {isScreenshot(selectedItem) ? 'OCR Extracted Text' : 'Scraped Content Preview'}
                  </h4>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.75rem',
                    lineHeight: 1.65,
                    color: '#4c5178',
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.90)',
                    boxShadow: 'inset 2px 2px 6px rgba(200,203,220,0.3)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}>
                    {selectedItem.ocr_text || selectedItem.document || 'No text content available.'}
                  </pre>
                </div>

                {/* Tags */}
                {getTags(selectedItem).length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8892b0', fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} />
                      Tags
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {getTags(selectedItem).map((tag, i) => (
                        <span key={i} className={`tag ${isScreenshot(selectedItem) ? '' : 'tag-teal'}`} style={{ fontSize: '0.75rem' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(108,99,255,0.10)',
                background: 'rgba(255,255,255,0.45)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button className="btn-primary" onClick={() => setSelectedItem(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
