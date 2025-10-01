'use client';

import { useState } from 'react';
import { Upload, FileImage, AlertCircle, X } from 'lucide-react';
import { MemorabiliaItemInput } from '@/lib/utils/memorabilia-parser';
import { processMemorabiliaHTMLFolder, uploadMemorabiliaImagesToCloudinary } from '@/lib/utils/memorabilia-html-parser';

interface BulkMemorabiliaUploadWithImagesProps {
  onImport: (items: MemorabiliaItemInput[]) => void;
  onCancel?: () => void;
}

export default function BulkMemorabiliaUploadWithImages({ onImport, onCancel }: BulkMemorabiliaUploadWithImagesProps) {
  const [htmlParsedItems, setHtmlParsedItems] = useState<MemorabiliaItemInput[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Map<number, string>>(new Map());
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHtmlFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setParsing(true);
    setError(null);
    setHtmlParsedItems([]);
    setUploadedImages(new Map());

    try {
      console.log('Processing HTML folder with', files.length, 'files');

      // Process the HTML folder
      const folderContent = await processMemorabiliaHTMLFolder(files);
      console.log('Found', folderContent.items.length, 'items');
      console.log('Found', folderContent.imageFiles.size, 'image files');

      // Upload images to Cloudinary
      const uploadedImageUrls = await uploadMemorabiliaImagesToCloudinary(folderContent.imageFiles);

      // Map parsed items to MemorabiliaItemInput format
      const memorabiliaItems: MemorabiliaItemInput[] = folderContent.items.map((item, index) => {
        const imageDataUrl = folderContent.imageMapping.get(index);
        const imageName = imageDataUrl ? `image${index + 1}.png` : undefined;
        const cloudinaryUrl = imageName && uploadedImageUrls.has(imageName)
          ? uploadedImageUrls.get(imageName)
          : imageDataUrl;

        return {
          id: `new-${Date.now()}-${index}`,
          name: item.name,
          description: item.description || '',
          value: item.price,
          quantity: item.quantity,
          imageUrl: cloudinaryUrl || ''
        };
      });

      setHtmlParsedItems(memorabiliaItems);

      // Update uploaded images map for preview
      const imageMap = new Map<number, string>();
      memorabiliaItems.forEach((item, index) => {
        if (item.imageUrl) {
          imageMap.set(index, item.imageUrl);
        }
      });
      setUploadedImages(imageMap);

      if (memorabiliaItems.length === 0) {
        setError('No memorabilia items found in the HTML file. Make sure the HTML contains properly formatted memorabilia information.');
      }
    } catch (err) {
      console.error('Error processing HTML folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to process HTML folder');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    if (htmlParsedItems.length > 0) {
      onImport(htmlParsedItems);
      // Clear the form after successful import
      setHtmlParsedItems([]);
      setUploadedImages(new Map());
      setError(null);
    }
  };

  const itemsToImport = htmlParsedItems;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Bulk Import Memorabilia (with Images)</h3>
          {onCancel && (
            <button onClick={onCancel} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-900/50 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Upload HTML Folder</h4>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="html-folder-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-300">
                      Upload HTML Folder from Google Docs
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Export your Google Doc as "Web Page (.html, zipped)" and upload the entire folder
                    </span>
                    <input
                      id="html-folder-upload"
                      name="html-folder-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleHtmlFolderUpload}
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      disabled={parsing}
                    />
                    <button
                      type="button"
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                      disabled={parsing}
                      onClick={() => document.getElementById('html-folder-upload')?.click()}
                    >
                      <FileImage className="w-4 h-4" />
                      {parsing ? 'Processing...' : 'Select Folder'}
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-900/50 border border-red-600 text-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {htmlParsedItems.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="text-sm text-gray-400">
                  Found {htmlParsedItems.length} memorabilia items with {uploadedImages.size} images
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                  {htmlParsedItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      {uploadedImages.has(index) && (
                        <div className="flex-shrink-0">
                          <img
                            src={uploadedImages.get(index)}
                            alt={`Item ${index + 1}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          ${item.value.toFixed(2)} - Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImport}
                  disabled={itemsToImport.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
                >
                  Import {itemsToImport.length} Memorabilia Items
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}