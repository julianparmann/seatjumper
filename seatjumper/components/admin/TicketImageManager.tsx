'use client';

import { useState, useEffect } from 'react';
import { Image, Plus, X, Star, Upload, Link2 } from 'lucide-react';

interface TicketImageManagerProps {
  ticketId: string;
  section: string;
  row: string;
  seatViewUrl?: string | null;
  seatViewUrl2?: string | null;
  seatViewUrl3?: string | null;
  primaryImageIndex?: number;
  onUpdate: (updates: {
    seatViewUrl?: string;
    seatViewUrl2?: string;
    seatViewUrl3?: string;
    primaryImageIndex?: number;
  }) => Promise<void>;
}

export default function TicketImageManager({
  ticketId,
  section,
  row,
  seatViewUrl: initialUrl1,
  seatViewUrl2: initialUrl2,
  seatViewUrl3: initialUrl3,
  primaryImageIndex: initialPrimary = 1,
  onUpdate
}: TicketImageManagerProps) {
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([
    initialUrl1 || null,
    initialUrl2 || null,
    initialUrl3 || null
  ]);
  const [primaryIndex, setPrimaryIndex] = useState(initialPrimary);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrls, setTempUrls] = useState<(string | null)[]>([null, null, null]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setImageUrls([
      initialUrl1 || null,
      initialUrl2 || null,
      initialUrl3 || null
    ]);
    setPrimaryIndex(initialPrimary);
  }, [initialUrl1, initialUrl2, initialUrl3, initialPrimary]);

  const handleEdit = () => {
    setTempUrls([...imageUrls]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempUrls([null, null, null]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        seatViewUrl: tempUrls[0] || undefined,
        seatViewUrl2: tempUrls[1] || undefined,
        seatViewUrl3: tempUrls[2] || undefined,
        primaryImageIndex: primaryIndex
      });
      setImageUrls([...tempUrls]);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update images:', error);
      alert('Failed to update images');
    } finally {
      setSaving(false);
    }
  };

  const setPrimaryImage = async (index: number) => {
    if (imageUrls[index - 1]) {
      setPrimaryIndex(index);
      await onUpdate({ primaryImageIndex: index });
    }
  };

  const handleUrlChange = (index: number, url: string) => {
    const newUrls = [...tempUrls];
    newUrls[index] = url || null;
    setTempUrls(newUrls);
  };

  const removeImage = (index: number) => {
    const newUrls = [...tempUrls];
    newUrls[index] = null;
    setTempUrls(newUrls);

    // If removing primary image, set first available as primary
    if (primaryIndex === index + 1) {
      const firstAvailable = newUrls.findIndex(url => url !== null);
      if (firstAvailable !== -1) {
        setPrimaryIndex(firstAvailable + 1);
      }
    }
  };

  // Get the primary image URL for display
  const getPrimaryImageUrl = () => {
    return imageUrls[primaryIndex - 1] || imageUrls.find(url => url !== null) || null;
  };

  const imageCount = imageUrls.filter(url => url !== null).length;

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-medium">
            Section {section}, Row {row}
          </h4>
          <p className="text-gray-400 text-sm mt-1">
            {imageCount} image{imageCount !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Edit Images
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="space-y-3">
          {imageCount > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  {url ? (
                    <div className="relative group">
                      <img
                        src={url}
                        alt={`View ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-700"
                      />
                      {primaryIndex === index + 1 && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Primary
                        </div>
                      )}
                      {primaryIndex !== index + 1 && (
                        <button
                          onClick={() => setPrimaryImage(index + 1)}
                          className="absolute top-1 right-1 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 border-2 border-dashed border-gray-700 rounded flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No images uploaded</p>
          )}
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-gray-300 text-sm">
                Image {index + 1} {primaryIndex === index + 1 && '(Primary)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempUrls[index] || ''}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="Enter Cloudinary URL..."
                  className="flex-1 bg-black/30 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                />
                {tempUrls[index] && (
                  <button
                    onClick={() => removeImage(index)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {tempUrls[index] && (
                <img
                  src={tempUrls[index]!}
                  alt={`Preview ${index + 1}`}
                  className="w-32 h-20 object-cover rounded border border-gray-700"
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-3 border-t border-gray-700">
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Images'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}