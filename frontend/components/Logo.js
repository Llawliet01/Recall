'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 40 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ rotate: 10, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer bounding frame (represented screenshot / capture) */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="20"
        stroke="url(#logo-grad)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Circular loop arrow (representing Recall / Memory loop) */}
      <path
        d="M40 35H58C66.2843 35 73 41.7157 73 50C73 58.2843 66.2843 65 58 65H42"
        stroke="url(#logo-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Arrowhead pointing backwards */}
      <path
        d="M50 57L40 65L50 73"
        stroke="url(#logo-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Glowing AI Core Dot */}
      <circle cx="50" cy="35" r="5" fill="#06B6D4" filter="url(#logo-glow)" />
    </motion.svg>
  );
}
