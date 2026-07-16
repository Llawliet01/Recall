'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle2, AlertCircle, Loader2, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dropzone({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    setIsUploading(true);
    setProgress(10);
    setStatusMsg(`Processing ${acceptedFiles.length} file(s)...`);
    setStatusType('info');

    let successCount = 0;
    let failCount = 0;

    try {
      const uploadPromises = acceptedFiles.map(async (file, idx) => {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('https://patelyug01234--recall-fastapi-app.modal.run/api/upload-file', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errDetail = await response.json();
            throw new Error(errDetail.detail || 'Upload failed');
          }

          const data = await response.json();

          successCount++;
          setProgress(Math.round(((idx + 1) / acceptedFiles.length) * 90) + 10);
          if (onUploadSuccess) onUploadSuccess(data);
        } catch (err) {
          console.error(`Failed: ${file.name}`, err);
          failCount++;
        }
      });

      await Promise.all(uploadPromises);
      setProgress(100);

      if (failCount === 0) {
        setStatusType('success');
        setStatusMsg(`✓ Successfully indexed ${successCount} screenshot(s)!`);
      } else if (successCount > 0) {
        setStatusType('info');
        setStatusMsg(`Indexed ${successCount}, failed ${failCount}.`);
      } else {
        setStatusType('error');
        setStatusMsg('Failed to process screenshot(s). Check API logs.');
      }
    } catch (err) {
      setStatusType('error');
      setStatusMsg('Upload pipeline error.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
    disabled: isUploading,
  });

  return (
    <div className="w-full space-y-3">
      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: isUploading ? 1 : 1.01 }}
        whileTap={{ scale: isUploading ? 1 : 0.99 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: isDragActive
            ? '2px solid rgba(108,99,255,0.70)'
            : '2px dashed rgba(108,99,255,0.25)',
          background: isDragActive
            ? 'rgba(108,99,255,0.06)'
            : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          boxShadow: isDragActive
            ? '0 0 0 4px rgba(108,99,255,0.12), 0 8px 32px rgba(108,99,255,0.10)'
            : '4px 4px 12px rgba(200,203,220,0.5), -4px -4px 12px rgba(255,255,255,0.8)',
          transition: 'all 0.3s ease',
          opacity: isUploading ? 0.7 : 1,
        }}
      >
        <input {...getInputProps()} />

        {/* Animated progress bar */}
        {isUploading && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0,
            height: '3px',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6C63FF, #00C9A7)',
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.4s ease',
          }} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {/* Icon */}
          <motion.div
            animate={isDragActive ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isDragActive
                ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)'
                : 'rgba(108,99,255,0.10)',
              border: '1.5px solid rgba(108,99,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 8px rgba(200,203,220,0.5), -3px -3px 8px rgba(255,255,255,0.9)',
            }}
          >
            {isUploading ? (
              <Loader2 style={{ width: 28, height: 28, color: '#6C63FF', animation: 'spin 1s linear infinite' }} />
            ) : isDragActive ? (
              <ImagePlus style={{ width: 28, height: 28, color: 'white' }} />
            ) : (
              <Upload style={{ width: 28, height: 28, color: '#6C63FF' }} />
            )}
          </motion.div>

          <div>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: '1.05rem',
              color: isDragActive ? '#6C63FF' : '#1e1b4b',
              marginBottom: '0.25rem',
            }}>
              {isUploading
                ? 'Extracting screenshot text...'
                : isDragActive
                ? 'Release to drop!'
                : 'Drop screenshots here'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#8892b0', fontFamily: "'Inter', sans-serif" }}>
              {isUploading ? `${progress}% complete` : 'PNG, JPG, WEBP · or click to browse'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status message */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.825rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              background: statusType === 'success'
                ? 'rgba(0,201,167,0.10)'
                : statusType === 'error'
                ? 'rgba(244,63,94,0.10)'
                : 'rgba(108,99,255,0.10)',
              border: `1px solid ${statusType === 'success'
                ? 'rgba(0,201,167,0.30)'
                : statusType === 'error'
                ? 'rgba(244,63,94,0.30)'
                : 'rgba(108,99,255,0.25)'}`,
              color: statusType === 'success'
                ? '#007A65'
                : statusType === 'error'
                ? '#C0132E'
                : '#5048D1',
            }}
          >
            {statusType === 'success' ? (
              <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} />
            ) : statusType === 'error' ? (
              <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            ) : (
              <Loader2 style={{ width: 18, height: 18, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            )}
            <span>{statusMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
