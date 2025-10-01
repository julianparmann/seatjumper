'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, Upload, AlertCircle, Check, X, Eye, Ticket, Image, Clipboard, Folder } from 'lucide-react';
import {
  parseTicketData,
  generateTicketGroupInputs,
  groupTicketsForPreview,
  calculateStats,
  validateParsedTickets,
  formatPrice,
  type ParsedTicket
} from '@/lib/utils/ticket-parser';
// Removed clipboard image extraction imports - only using folder upload for images
import {
  processHTMLFolder,
  uploadImagesToCloudinary
} from '@/lib/utils/html-folder-parser-v2';

interface BulkTicketUploadWithImagesProps {
  onImport: (ticketGroups: any[]) => void;
  onCancel: () => void;
}

export default function BulkTicketUploadWithImages({
  onImport,
  onCancel
}: BulkTicketUploadWithImagesProps) {
  const [rawData, setRawData] = useState('');
  const [parsedTickets, setParsedTickets] = useState<ParsedTicket[]>([]);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [ticketImageMap, setTicketImageMap] = useState<Map<number, { image1: string; image2?: string }>>(new Map());
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [manualImageUrls, setManualImageUrls] = useState<{[key: number]: {url1?: string; url2?: string}}>({});
  const [uploadMode, setUploadMode] = useState<'paste' | 'folder'>('paste');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Removed clipboard paste event listener - text pasting handled by textarea onChange

  const handleParse = () => {
    setProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Parse the raw data
      const tickets = parseTicketData(rawData);

      // Validate parsed tickets
      const validation = validateParsedTickets(tickets);
      setWarnings(validation.warnings);

      if (!validation.valid) {
        setErrors(validation.errors);
        setProcessing(false);
        return;
      }

      setParsedTickets(tickets);
      setShowPreview(true);
    } catch (error: any) {
      setErrors([error.message || 'Failed to parse ticket data']);
    }

    setProcessing(false);
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    setUploadingImages(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Process the HTML folder with new parser
      const folderContent = await processHTMLFolder(files);

      if (folderContent.tickets.length === 0) {
        setErrors(['No ticket information found in the HTML file']);
        setProcessing(false);
        setUploadingImages(false);
        return;
      }

      // Set parsed tickets
      setParsedTickets(folderContent.tickets);

      // Convert image pairs to our format
      const imageMap = new Map<number, { image1: string; image2?: string }>();
      const allImageUrls: string[] = [];

      // Process image pairs from the parser
      folderContent.imagePairs.forEach((pair, ticketIndex) => {
        // CRITICAL: Filter out ALL non-HTTP URLs including data URLs
        let img1: string | null = pair.image1;
        let img2: string | null = pair.image2;

        // Strict validation - only accept HTTP/HTTPS URLs
        if (img1) {
          if (!img1.startsWith('http://') && !img1.startsWith('https://')) {
            console.error(`[FOLDER] Ticket ${ticketIndex}: Image 1 is not a valid HTTP URL (${img1.substring(0, 50)}...), removing`);
            img1 = null;
          } else if (img1.startsWith('data:')) {
            console.error(`[FOLDER CRITICAL] Ticket ${ticketIndex}: Image 1 is a DATA URL, absolutely removing`);
            img1 = null;
          }
        }

        if (img2) {
          if (!img2.startsWith('http://') && !img2.startsWith('https://')) {
            console.error(`[FOLDER] Ticket ${ticketIndex}: Image 2 is not a valid HTTP URL (${img2.substring(0, 50)}...), removing`);
            img2 = null;
          } else if (img2.startsWith('data:')) {
            console.error(`[FOLDER CRITICAL] Ticket ${ticketIndex}: Image 2 is a DATA URL, absolutely removing`);
            img2 = null;
          }
        }

        imageMap.set(ticketIndex, {
          image1: img1 || '',  // Use empty string as fallback
          image2: img2 || ''   // Use empty string as fallback
        });

        // Also add to flat array for preview (2 images per ticket)
        // Only add valid URLs or empty string
        allImageUrls.push(img1 || '');
        allImageUrls.push(img2 || '');
      });

      setExtractedImages(allImageUrls);
      setTicketImageMap(imageMap);
      setShowPreview(true);

      setWarnings([
        `Found ${folderContent.tickets.length} tickets with ${folderContent.imagePairs.size * 2} images`,
        `Each ticket has 2 associated images`
      ]);
    } catch (error: any) {
      setErrors([error.message || 'Failed to process folder']);
    } finally {
      setProcessing(false);
      setUploadingImages(false);
    }
  };

  const handleImport = () => {
    // Generate base ticket inputs first
    const baseInputs = generateTicketGroupInputs(parsedTickets);

    // Now add the image URLs (2 per ticket)
    const ticketGroupInputs = baseInputs.map((input, idx) => {
      // For paste mode, use manually entered URLs
      // For folder mode, use the uploaded images
      let image1: string | null = null;
      let image2: string | null = null;

      if (uploadMode === 'paste') {
        // Use manually entered URLs for paste mode
        const manualImages = manualImageUrls[idx] || {};
        image1 = manualImages.url1 || null;
        image2 = manualImages.url2 || null;
      } else {
        // Use images from folder upload
        const images = ticketImageMap.get(idx);
        const imageIdx = idx * 2;
        image1 = images?.image1 || extractedImages[imageIdx] || null;
        image2 = images?.image2 || extractedImages[imageIdx + 1] || null;
      }

      // Never send data URLs or empty strings - only valid URLs or null
      if (!image1 || image1.startsWith('data:') || image1 === '' || !image1.startsWith('http')) {
        if (image1) {
          console.warn(`Ticket ${idx}: Image 1 is invalid (${image1.substring(0, 50)}), setting to null`);
        }
        image1 = null;
      }
      if (!image2 || image2.startsWith('data:') || image2 === '' || !image2.startsWith('http')) {
        if (image2) {
          console.warn(`Ticket ${idx}: Image 2 is invalid (${image2.substring(0, 50)}), setting to null`);
        }
        image2 = null;
      }

      console.log(`Ticket ${idx}: Image1=${image1?.substring(0, 50)}, Image2=${image2?.substring(0, 50)}`);

      // Ensure we're sending null not undefined for missing images
      const result = {
        ...input,
        seatViewUrl: image1 || null,
        seatViewUrl2: image2 || null
      };

      // Final validation - log what we're actually sending
      if (result.seatViewUrl && result.seatViewUrl.startsWith('data:')) {
        console.error(`CRITICAL: Ticket ${idx} still has base64 in seatViewUrl after all validation!`);
        result.seatViewUrl = null;
      }
      if (result.seatViewUrl2 && result.seatViewUrl2.startsWith('data:')) {
        console.error(`CRITICAL: Ticket ${idx} still has base64 in seatViewUrl2 after all validation!`);
        result.seatViewUrl2 = null;
      }

      console.log(`Final ticket ${idx}: url1=${result.seatViewUrl ? 'valid' : 'null'}, url2=${result.seatViewUrl2 ? 'valid' : 'null'}`);
      return result;
    });

    onImport(ticketGroupInputs);
  };

  const handleExampleData = () => {
    const exampleData = `Section 406
Row 3
2 tickets together
Third row of section
Clear view
$237
  incl. fees

Section 421
Row 3
2 tickets together
Third row of section
Clear view
Only 4 left
$480
Now
$253
  incl. fees

Section 433
Row 10 | Seats 16 - 17
2 tickets together
Instant Download
Clear view
Only 2 left
$422
Now
$259
  incl. fees`;

    setRawData(exampleData);
  };

  const stats = showPreview ? calculateStats(parsedTickets) : null;
  const groupedTickets = showPreview ? groupTicketsForPreview(parsedTickets) : new Map();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Upload className="w-7 h-7 text-purple-500" />
            Bulk Upload Tickets with Images
          </h2>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            Copy ticket listings from any website and paste here - images will be automatically extracted!
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showPreview ? (
            <>
              {/* Upload Mode Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setUploadMode('paste')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                    uploadMode === 'paste'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  Copy & Paste
                </button>
                <button
                  onClick={() => setUploadMode('folder')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                    uploadMode === 'folder'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  HTML Folder
                </button>
              </div>

              {/* Input Section */}
              <div className="mb-6">
                {uploadMode === 'paste' ? (
                  <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Paste Ticket Data
                    </label>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={rawData}
                        onChange={(e) => setRawData(e.target.value)}
                        className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Paste ticket data here (Section, Row, Price, etc.)&#10;Format: Section 123, Row A, 2 tickets, $100 each"
                      />
                      {/* Removed uploading images indicator for paste mode */}
                    </div>

                    <button
                      onClick={handleExampleData}
                      className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      Load example data
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload HTML Folder (from Google Docs export)
                    </label>
                    <div className="space-y-4">
                      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                        <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-300 mb-2">Upload folder containing HTML and images</p>
                        <p className="text-xs text-gray-500 mb-4">
                          Export from Google Docs: File → Download → Web Page (.html, zipped)
                        </p>
                        <input
                          ref={folderInputRef}
                          type="file"
                          webkitdirectory=""
                          directory=""
                          multiple
                          onChange={handleFolderUpload}
                          className="hidden"
                          id="folder-upload"
                        />
                        <label
                          htmlFor="folder-upload"
                          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                        >
                          Select Folder
                        </label>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">How to export from Google Docs:</h4>
                        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                          <li>Open your Google Doc with ticket listings</li>
                          <li>Go to File → Download → Web Page (.html, zipped)</li>
                          <li>Extract the downloaded ZIP file</li>
                          <li>Upload the extracted folder here</li>
                        </ol>
                      </div>
                    </div>

                    {uploadingImages && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Processing folder...
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Extracted Images Preview */}
              {extractedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Extracted Images ({extractedImages.length})
                    <span className="text-xs text-gray-500">({Math.floor(extractedImages.length / 2)} ticket{Math.floor(extractedImages.length / 2) !== 1 ? 's' : ''} × 2 images each)</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {extractedImages.map((url, idx) => {
                      const ticketIndex = Math.floor(idx / 2);
                      const imageNumber = (idx % 2) + 1;
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Ticket ${ticketIndex + 1} - Image ${imageNumber}`}
                            className="w-full h-24 object-cover rounded border border-gray-700"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs text-white">
                              T{ticketIndex + 1}-Img{imageNumber}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Errors and Warnings */}
              {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <h3 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Errors
                  </h3>
                  <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                  <h3 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Warnings
                  </h3>
                  <ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    Preview ({parsedTickets.length} tickets)
                  </span>
                  {stats && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">
                        Total Seats: <span className="text-white font-medium">{stats.totalSeats}</span>
                      </span>
                      <span className="text-gray-400">
                        Avg Price: <span className="text-white font-medium">{formatPrice(stats.avgPrice)}</span>
                      </span>
                      <span className="text-gray-400">
                        Total Value: <span className="text-white font-medium">{formatPrice(stats.totalSeats * stats.avgPrice)}</span>
                      </span>
                    </div>
                  )}
                </h3>

                {/* Grouped Tickets */}
                <div className="space-y-4">
                  {Array.from(groupedTickets.entries()).map(([key, tickets]) => (
                    <div key={key} className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">{key}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tickets.map((ticket: ParsedTicket, idx: number) => {
                          const globalIndex = parsedTickets.indexOf(ticket);
                          const images = ticketImageMap.get(globalIndex);
                          const imageIdx = globalIndex * 2;
                          const image1 = images?.image1 || extractedImages[imageIdx];
                          const image2 = images?.image2 || extractedImages[imageIdx + 1];

                          return (
                            <div key={idx} className="bg-gray-700/50 rounded p-3">
                              {/* Image section - show inputs for paste mode, previews for folder mode */}
                              {uploadMode === 'paste' ? (
                                <div className="mb-3 space-y-2">
                                  <div className="text-xs text-gray-400 mb-1">Image URLs (optional):</div>
                                  <input
                                    type="text"
                                    placeholder="Image URL 1"
                                    value={manualImageUrls[globalIndex]?.url1 || ''}
                                    onChange={(e) => setManualImageUrls({
                                      ...manualImageUrls,
                                      [globalIndex]: {
                                        ...manualImageUrls[globalIndex],
                                        url1: e.target.value
                                      }
                                    })}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Image URL 2"
                                    value={manualImageUrls[globalIndex]?.url2 || ''}
                                    onChange={(e) => setManualImageUrls({
                                      ...manualImageUrls,
                                      [globalIndex]: {
                                        ...manualImageUrls[globalIndex],
                                        url2: e.target.value
                                      }
                                    })}
                                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                                  />
                                </div>
                              ) : (
                                /* Image Previews for folder mode */
                                (image1 || image2) && (
                                  <div className="flex gap-1 mb-3">
                                    {image1 && (
                                      <img
                                        src={image1}
                                        alt={`Section ${ticket.section} - View 1`}
                                        className="w-16 h-16 object-cover rounded border border-gray-600"
                                      />
                                    )}
                                    {image2 && (
                                      <img
                                        src={image2}
                                        alt={`Section ${ticket.section} - View 2`}
                                        className="w-16 h-16 object-cover rounded border border-gray-600"
                                      />
                                    )}
                                  </div>
                                )
                              )}

                              {/* Ticket Details */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-white font-medium">
                                      Section {ticket.section}, Row {ticket.row}
                                    </span>
                                    {ticket.seats && (
                                      <span className="text-gray-400 text-sm ml-2">
                                        Seats {ticket.seats}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-medium">
                                      {formatPrice(ticket.price)}
                                    </div>
                                    {ticket.originalPrice && (
                                      <div className="text-gray-500 line-through text-sm">
                                        {formatPrice(ticket.originalPrice)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1">
                                  <span className="text-purple-400 text-xs">
                                    {ticket.quantity} tickets
                                  </span>
                                  {ticket.attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {ticket.attributes.map((attr: string, attrIdx: number) => (
                                        <span
                                          key={attrIdx}
                                          className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded"
                                        >
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {!showPreview ? (
              <button
                onClick={handleParse}
                disabled={!rawData || processing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Parse & Preview
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setParsedTickets([]);
                  }}
                  className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Import {parsedTickets.length} Tickets
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}