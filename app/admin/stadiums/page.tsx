'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Plus, Edit2, Trash2, Save, X, Image, Upload } from 'lucide-react';

interface StadiumData {
  id: string;
  name: string;
  displayName: string;
  city: string;
  state: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  sectionConfig: any;
  defaultSeatViewUrl?: string | null;
  isActive: boolean;
}

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<StadiumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    city: '',
    state: '',
    imagePath: '',
    defaultSeatViewUrl: '',
    imageWidth: 1920,
    imageHeight: 1080,
    sectionConfig: '{}',
    isActive: true
  });

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const response = await fetch('/api/admin/stadiums');
      if (response.ok) {
        const data = await response.json();
        setStadiums(data);
      }
    } catch (error) {
      console.error('Error fetching stadiums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get image dimensions (only in browser environment)
      if (typeof window !== 'undefined') {
        const img = new window.Image();
        img.onload = () => {
          setFormData({
            ...formData,
            imageWidth: img.width,
            imageHeight: img.height
          });
        };
        img.src = URL.createObjectURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);

    try {
      let finalImagePath = formData.imagePath;

      // If there's an image file, upload it first
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);

        const uploadResponse = await fetch('/api/admin/stadiums/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const { imagePath } = await uploadResponse.json();
        finalImagePath = imagePath;
      }

      const url = editingId
        ? `/api/admin/stadiums/${editingId}`
        : '/api/admin/stadiums';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imagePath: finalImagePath,
          sectionConfig: JSON.parse(formData.sectionConfig || '{}'),
          imageWidth: parseInt(formData.imageWidth.toString()),
          imageHeight: parseInt(formData.imageHeight.toString())
        }),
      });

      if (response.ok) {
        fetchStadiums();
        resetForm();
        alert('Stadium saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save stadium');
      }
    } catch (error: any) {
      console.error('Error saving stadium:', error);
      alert(`Failed to save stadium: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (stadium: StadiumData) => {
    setEditingId(stadium.id);
    setFormData({
      name: stadium.name,
      displayName: stadium.displayName,
      city: stadium.city,
      state: stadium.state,
      imagePath: stadium.imagePath,
      defaultSeatViewUrl: stadium.defaultSeatViewUrl || '',
      imageWidth: stadium.imageWidth,
      imageHeight: stadium.imageHeight,
      sectionConfig: JSON.stringify(stadium.sectionConfig, null, 2),
      isActive: stadium.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stadium?')) return;

    try {
      const response = await fetch(`/api/admin/stadiums/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStadiums();
      }
    } catch (error) {
      console.error('Error deleting stadium:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      city: '',
      state: '',
      imagePath: '',
      defaultSeatViewUrl: '',
      imageWidth: 1920,
      imageHeight: 1080,
      sectionConfig: '{}',
      isActive: true
    });
    setEditingId(null);
    setShowAddForm(false);
    setImageFile(null);
    setImagePreview('');
  };

  const seedAllegiantStadium = async () => {
    try {
      const response = await fetch('/api/admin/stadiums/seed', {
        method: 'POST',
      });

      if (response.ok) {
        fetchStadiums();
      }
    } catch (error) {
      console.error('Error seeding stadium:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Building2 className="w-8 h-8 text-purple-600" />
          Stadium Management
        </h1>
        <div className="flex gap-3">
          <button
            onClick={seedAllegiantStadium}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Seed Allegiant Stadium
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Stadium
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Stadium' : 'Add New Stadium'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stadium ID Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="allegiant-stadium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Allegiant Stadium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Las Vegas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="NV"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stadium Image
                </label>

                {/* File upload input */}
                <div className="mb-3">
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 dark:border-gray-600 dark:hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {imageFile ? imageFile.name : 'Choose image file or use URL below'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Stadium preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* URL input as alternative */}
                <input
                  type="text"
                  value={formData.imagePath}
                  onChange={(e) => setFormData({ ...formData, imagePath: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Or enter image URL (optional)"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image Width
                  </label>
                  <input
                    type="number"
                    value={formData.imageWidth}
                    onChange={(e) => setFormData({ ...formData, imageWidth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image Height
                  </label>
                  <input
                    type="number"
                    value={formData.imageHeight}
                    onChange={(e) => setFormData({ ...formData, imageHeight: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Seat View URL
              </label>
              <input
                type="text"
                value={formData.defaultSeatViewUrl}
                onChange={(e) => setFormData({ ...formData, defaultSeatViewUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://example.com/default-seat-view.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                This image will be used for tickets without specific seat view images. A "Stock Image" overlay will be added.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section Configuration (JSON)
              </label>
              <textarea
                value={formData.sectionConfig}
                onChange={(e) => setFormData({ ...formData, sectionConfig: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                rows={6}
                placeholder='{"sections": []}'
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 inline mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImage}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <>
                    <div className="w-5 h-5 inline-block mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 inline mr-1" />
                    {editingId ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {stadiums.map((stadium) => (
          <div
            key={stadium.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {stadium.displayName}
                  </h3>
                  {stadium.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {stadium.city}, {stadium.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {stadium.imageWidth}x{stadium.imageHeight}
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-500">
                  ID: {stadium.name} | Path: {stadium.imagePath}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(stadium)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(stadium.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {stadiums.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No stadiums found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Click "Add Stadium" or "Seed Allegiant Stadium" to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}