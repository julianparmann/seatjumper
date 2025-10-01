'use client';

import { useState } from 'react';
import { Plus, Loader2, CheckCircle, AlertCircle, Image, Package } from 'lucide-react';

interface ManualItemEntryProps {
  gameId: string;
  onItemAdded?: () => void;
}

// Predefined saved images
const SAVED_IMAGES = [
  {
    id: 'fat-pack',
    name: 'Fat Pack',
    url: '/images/fat-pack.svg',
    icon: '📦'
  },
  {
    id: 'mystery-box',
    name: 'Mystery Box',
    url: '/images/mystery-box.png',
    icon: '🎁'
  },
  {
    id: 'trading-card',
    name: 'Trading Card',
    url: '/images/trading-card.png',
    icon: '🃏'
  }
];

export default function ManualItemEntry({ gameId, onItemAdded }: ManualItemEntryProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedSavedImage, setSelectedSavedImage] = useState('');
  const [imageType, setImageType] = useState<'url' | 'saved'>('url');
  const [itemLink, setItemLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantity) || 1;

    if (!title.trim() || !price.trim() || qty < 1) {
      setError('Title, price, and valid quantity are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Determine which image URL to use
      const finalImageUrl = imageType === 'saved'
        ? SAVED_IMAGES.find(img => img.id === selectedSavedImage)?.url || null
        : imageUrl.trim() || null;

      // Use bulk endpoint for multiple items
      const endpoint = qty > 1 ? '/api/admin/manual-item/bulk' : '/api/admin/manual-item';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          title: title.trim(),
          price: parseFloat(price),
          quantity: qty,
          imageUrl: finalImageUrl,
          itemLink: itemLink.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      setSuccess(true);
      setSuccessMessage(data.message || `Successfully added ${qty} item(s)`);
      setTitle('');
      setPrice('');
      setQuantity('1');
      setImageUrl('');
      setSelectedSavedImage('');
      setImageType('url');
      setItemLink('');

      if (onItemAdded) {
        onItemAdded();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Plus className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Add Item Manually</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Item Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Michael Jordan Signed Basketball"
            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="299.99"
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              disabled={loading}
            />
            {parseInt(quantity) > 100 && (
              <p className="text-xs text-yellow-400 mt-1">
                Large quantity - this may take a moment to process
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Item Image (optional)
          </label>

          {/* Toggle between URL and Saved Images */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setImageType('url')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                imageType === 'url'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Custom URL
              </div>
            </button>
            <button
              type="button"
              onClick={() => setImageType('saved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                imageType === 'saved'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Saved Images
              </div>
            </button>
          </div>

          {imageType === 'url' ? (
            <>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                disabled={loading}
              />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <select
                value={selectedSavedImage}
                onChange={(e) => setSelectedSavedImage(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                disabled={loading}
              >
                <option value="" className="bg-gray-800">Select an image...</option>
                {SAVED_IMAGES.map((img) => (
                  <option key={img.id} value={img.id} className="bg-gray-800">
                    {img.icon} {img.name}
                  </option>
                ))}
              </select>
              {selectedSavedImage && (
                <div className="mt-2">
                  {SAVED_IMAGES.find(img => img.id === selectedSavedImage) && (
                    <div className="flex items-center gap-3">
                      <img
                        src={SAVED_IMAGES.find(img => img.id === selectedSavedImage)?.url}
                        alt="Preview"
                        className="w-32 h-32 object-contain bg-white/5 rounded-lg p-2"
                      />
                      <div className="text-gray-300">
                        <p className="font-medium">
                          {SAVED_IMAGES.find(img => img.id === selectedSavedImage)?.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          Saved image
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Product Link (optional)
          </label>
          <input
            type="url"
            value={itemLink}
            onChange={(e) => setItemLink(e.target.value)}
            placeholder="https://example.com/product-page"
            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Link to product page or more information
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !price.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding {parseInt(quantity) || 1} item{(parseInt(quantity) || 1) > 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add {parseInt(quantity) || 1} Item{(parseInt(quantity) || 1) > 1 ? 's' : ''}
              {parseInt(quantity) > 1 && (
                <span className="text-sm opacity-75">
                  (${((parseFloat(price) || 0) * (parseInt(quantity) || 1)).toFixed(2)} total)
                </span>
              )}
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{successMessage || 'Item added successfully!'}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}