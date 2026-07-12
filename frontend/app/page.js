'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Link as LinkIcon, Plus, Search, HelpCircle, Compass, ListFilter } from 'lucide-react';
import Dropzone from '../components/Dropzone';
import CardGrid from '../components/CardGrid';
import ChatSidebar from '../components/ChatSidebar';

export default function Home() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [isScrapingLink, setIsScrapingLink] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('knosnap_items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved items:", e);
      }
    }
  }, []);

  // Save items to localStorage whenever they change
  const saveItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('knosnap_items', JSON.stringify(newItems));
  };

  const handleUploadSuccess = (item) => {
    const updated = [item, ...items];
    saveItems(updated);
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkInput.trim() || isScrapingLink) return;

    setIsScrapingLink(true);
    try {
      // Create a unique temporary ID for the link metadata row
      const tempId = `link-${Date.now()}`;
      
      const response = await fetch("http://localhost:8000/api/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tempId,
          url: linkInput
        })
      });

      if (!response.ok) {
        throw new Error("Failed to process web link");
      }

      const data = await response.json();
      const updated = [data, ...items];
      saveItems(updated);
      setLinkInput("");
    } catch (err) {
      alert(err.message || "Failed to index link");
    } finally {
      setIsScrapingLink(false);
    }
  };

  // Perform semantic vector search on server if query exists
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns ChromaDB results containing metadata.
        // We map these results back to our structured cards list format
        if (data.results && data.results.length > 0) {
          const mappedItems = data.results.map(res => ({
            id: res.id,
            ocr_text: res.document,
            document: res.document,
            metadata: res.metadata
          }));
          setItems(mappedItems);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.error("Semantic search failed:", err);
    }
  };

  // Clear search and reload all items from localStorage
  const clearSearch = () => {
    setSearchQuery("");
    const saved = localStorage.getItem('knosnap_items');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative">
      {/* Decorative top ambient glowing gradient blur */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[400px] h-[250px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                KnoSnap
              </h1>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Multi-Modal AI Brain</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Ask AI Brain</span>
            </button>
          </div>
        </header>

        {/* Upload Panel (Images & Links inputs side by side) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-10">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Ingest Screenshot</h2>
            <Dropzone onUploadSuccess={handleUploadSuccess} />
          </div>
          
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Ingest Link Bookmark</h2>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div className="relative flex items-center">
                  <input
                    type="url"
                    required
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com/blog..."
                    className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:outline-none text-sm placeholder-gray-500 text-white transition-colors"
                  />
                  <LinkIcon className="absolute left-3 w-4 h-4 text-gray-500" />
                </div>
                <button
                  type="submit"
                  disabled={isScrapingLink}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-gray-600 text-white shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isScrapingLink ? 'Scraping Web Content...' : 'Add Web Link'}</span>
                </button>
              </form>
            </div>

            {/* Quick Helper card */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-white/2 mt-6">
              <div className="flex items-start space-x-3">
                <Compass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">How it works?</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Upload any image to run local OCR extraction, or paste web page links to extract HTML text content. The system embeds text and files into ChromaDB for search and conversational Q&A.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters Segment */}
        <section className="py-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            {/* Search Input bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search semantic concepts (e.g. error log details)..."
                className="w-full pl-10 pr-24 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-20 top-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1.5 hover:bg-white/5 rounded"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleSearch}
                className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Go
              </button>
            </div>

            {/* Ingestion filters */}
            <div className="flex items-center space-x-2 bg-white/5 p-1 border border-white/5 rounded-xl shrink-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All items
              </button>
              <button
                onClick={() => setFilter('screenshots')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === 'screenshots' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Screenshots
              </button>
              <button
                onClick={() => setFilter('links')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === 'links' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Links
              </button>
            </div>
          </div>

          {/* Grid display */}
          <CardGrid items={items} filter={filter} />
        </section>
      </div>

      {/* Slide-out Sidebar Drawer */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  );
}
