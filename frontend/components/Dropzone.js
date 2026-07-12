'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dropzone({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState(null); // 'success', 'error', 'info'

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setStatusMsg("Reading file locally & running PaddleOCR...");
    setStatusType("info");

    try {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append("file", file);

      // Call the direct raw file upload backend endpoint
      const response = await fetch("http://localhost:8000/api/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Upload failed");
      }

      const data = await response.json();
      setStatusType("success");
      setStatusMsg(`Successfully indexed "${data.metadata.title}"!`);
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setStatusType("error");
      setStatusMsg(err.message || "Failed to process screenshot");
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all duration-300 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/20 bg-white/5 hover:border-indigo-400 hover:bg-white/10'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
            <Upload className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-lg">
              {isDragActive ? 'Drop your screenshot here!' : 'Drag & drop your screenshot'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Supports PNG, JPG, WEBP (Max 10MB)
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-start space-x-3 border text-sm transition-all duration-300 ${
            statusType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : statusType === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {statusType === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : statusType === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <FileImage className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div className="flex-1 font-medium">{statusMsg}</div>
        </div>
      )}
    </div>
  );
}
