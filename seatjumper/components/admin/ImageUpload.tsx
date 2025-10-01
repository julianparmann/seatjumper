'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  folder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  placeholder = "Upload Image",
  className = "",
  folder = "seat-views"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPreview(base64);

        // Upload to Cloudinary
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            folder: folder
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorData?.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error('No URL returned from upload');
        }

        onChange(data.url);
        setPreview(data.url);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInput = () => {
    const url = prompt('Enter image URL:', value);
    if (url !== null) {
      onChange(url);
      setPreview(url);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative bg-white/10 rounded-lg p-2">
          <img
            src={preview}
            alt="Seat view"
            className="w-full h-32 object-cover rounded"
            onError={() => setPreview('')}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {placeholder}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleUrlInput}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded text-sm transition-colors"
            title="Enter URL"
            disabled={uploading}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* URL input field (visible if user prefers typing) */}
      <input
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setPreview(e.target.value);
        }}
        className="w-full mt-1 p-1 bg-white/5 rounded text-white text-xs"
        placeholder="Or paste URL here..."
        disabled={uploading}
      />
    </div>
  );
}