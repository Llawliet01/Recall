'use client';

import React, { useState } from 'react';
import { ExternalLink, Calendar, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';

export default function CardGrid({ items, filter }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter items locally based on selected tab
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'screenshots') return item.metadata.type === 'screenshot';
    if (filter === 'links') return item.metadata.type === 'link';
    return true;
  });

  const getTags = (item) => {
    try {
      return JSON.parse(item.metadata.tags || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className="w-full">
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
          <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-400">No saved items found</p>
          <p className="text-sm text-gray-500 mt-1">Upload a screenshot or paste a link to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isScreenshot = item.metadata.type === 'screenshot';
            const tags = getTags(item);
            
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full"
              >
                {/* Visual Card Header */}
                <div className="relative h-48 bg-slate-900 flex items-center justify-center border-b border-white/5 overflow-hidden">
                  {isScreenshot ? (
                    /* In local demo, we can display a fallback or base64 if available, or a mock graphic */
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 text-indigo-400 mb-2" />
                      <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1">SCREENSHOT</span>
                      <p className="text-sm font-semibold truncate max-w-full">{item.metadata.title}</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gradient-to-br from-indigo-950/20 to-slate-950/40">
                      <LinkIcon className="w-12 h-12 text-emerald-400 mb-2" />
                      <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">BOOKMARK LINK</span>
                      <p className="text-sm font-semibold truncate max-w-full">{item.metadata.title}</p>
                    </div>
                  )}
                </div>

                {/* Card content info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {item.metadata.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed flex-1">
                    {item.metadata.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-xs text-gray-500 font-medium self-center pl-1">
                        +{tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
          <div 
            className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedItem.metadata.type === 'screenshot' 
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                }`}>
                  {selectedItem.metadata.type === 'screenshot' ? 'SCREENSHOT' : 'BOOKMARK LINK'}
                </span>
                <h2 className="font-extrabold text-2xl text-white mt-2">{selectedItem.metadata.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Scroll container */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Summary Description */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">AI Summary</h4>
                <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                  {selectedItem.metadata.description}
                </p>
              </div>

              {/* Source Reference Links */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Source Asset Reference</h4>
                <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                  {selectedItem.metadata.type === 'screenshot' ? (
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <LinkIcon className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {selectedItem.metadata.type === 'screenshot' ? selectedItem.metadata.image_url : selectedItem.metadata.url}
                  </span>
                  <a
                    href={selectedItem.metadata.type === 'screenshot' ? selectedItem.metadata.image_url : selectedItem.metadata.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Extracted Details (OCR raw text / Scraped Text) */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {selectedItem.metadata.type === 'screenshot' ? 'OCR Extracted Text' : 'Bookmark Scraped Text Preview'}
                </h4>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-400 bg-black/30 p-4 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                  {selectedItem.ocr_text || selectedItem.document || "No text body available."}
                </pre>
              </div>

              {/* Full Keywords list */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Metadata Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {getTags(selectedItem).map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
