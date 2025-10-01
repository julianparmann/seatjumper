'use client';

import { useState } from 'react';
import { Package, Upload, AlertCircle, Check, X, Trophy, DollarSign } from 'lucide-react';
import {
  parseMemorabiliaData,
  generateMemorabiliaInputs,
  groupMemorabiliaByPriceRange,
  calculateMemorabiliaStats,
  validateMemorabiliaItems,
  formatPrice,
  type ParsedMemorabiliaItem
} from '@/lib/utils/memorabilia-parser';

interface BulkMemorabiliaParserProps {
  onImport: (memorabiliaItems: any[]) => void;
  onCancel: () => void;
}

export default function BulkMemorabiliaParser({ onImport, onCancel }: BulkMemorabiliaParserProps) {
  const [rawData, setRawData] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedMemorabiliaItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleParse = () => {
    setProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Parse the raw data
      const items = parseMemorabiliaData(rawData);

      // Validate parsed items
      const validation = validateMemorabiliaItems(items);
      setWarnings(validation.warnings);

      if (!validation.valid) {
        setErrors(validation.errors);
        setProcessing(false);
        return;
      }

      setParsedItems(items);
      setShowPreview(true);
    } catch (error: any) {
      setErrors([error.message || 'Failed to parse memorabilia data']);
    }

    setProcessing(false);
  };

  const handleImport = () => {
    const memorabiliaInputs = generateMemorabiliaInputs(parsedItems);
    onImport(memorabiliaInputs);
  };

  const handleExampleData = () => {
    const exampleData = `MAXX CROSBY Las Vegas Raiders Signed 2022 Silver Panini Prizm Card PSA
$463.99
Almost Gone
Raiders Davante Adams Signed 2022 Panini MG #208 Card Auto Grade 10! BAS Slabbed
$176.99
Almost Gone
Josh Jacobs Signed Las Vegas Raiders 2019 Panini Prizm Card #323 PSA 97500617
$237.99
2023 Panini Score Davante Adams Las Vegas Raiders Signed Auto Card #134 PSA DNA
$81.99
Raiders Davante Adams Signed 2022 Panini Mosaic Thunder Lane #9 Card BAS Slabbed
$111.99
Michael Mayer Raiders 2023 Panini Mosaic #349 Signed Card Auto Grade 10 BECKETT
$101.99
Jason Witten Signed 2003 Topps #372 Trading Card Grade 10 Auto BAS 41213
$290.99
2014 Totally Certified Derek Carr Gold Penmanship Autographed Signed Card RC 2/5
$3,546.99`;

    setRawData(exampleData);
  };

  const stats = showPreview ? calculateMemorabiliaStats(parsedItems) : null;
  const groupedItems = showPreview ? groupMemorabiliaByPriceRange(parsedItems) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Bulk Memorabilia Import</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showPreview ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-300">
                  Paste your memorabilia/card data below. Format: Item name, then price on next line.
                </p>
                <button
                  onClick={handleExampleData}
                  className="text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  Load Example Data
                </button>
              </div>

              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="Paste your memorabilia data here...

Example format:
MAXX CROSBY Las Vegas Raiders Signed 2022 Silver Panini Prizm Card PSA
$463.99

Raiders Davante Adams Signed 2022 Panini MG #208 Card Auto Grade 10! BAS Slabbed
$176.99
..."
                className="w-full h-96 p-4 bg-black/50 border border-white/20 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
              />

              {errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Parsing Errors</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Warnings</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleParse}
                  disabled={!rawData.trim() || processing}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center gap-2 transition"
                >
                  <Upload className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Parse Data'}
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Successfully Parsed {parsedItems.length} Memorabilia Items</span>
                </div>
                <p className="text-sm text-green-300">
                  Each item will be added to the memorabilia inventory
                </p>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Items</div>
                    <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-purple-400">{formatPrice(stats.totalValue)}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Avg Value</div>
                    <div className="text-2xl font-bold text-white">{formatPrice(stats.avgValue)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatPrice(stats.minValue)} - {formatPrice(stats.maxValue)}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Special</div>
                    <div className="text-lg font-bold text-white">
                      {stats.autographedCount} Auto
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {stats.authenticatedCount} Authenticated
                    </div>
                  </div>
                </div>
              )}

              {/* Grouped Preview */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Preview by Price Range</h3>

                {groupedItems && Array.from(groupedItems.entries()).map(([priceRange, items]) => (
                  <div key={priceRange} className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        {priceRange}
                      </h4>
                      <span className="text-sm text-gray-400">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {items.map((item, idx) => (
                        <div key={idx} className="bg-black/30 rounded p-3 flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="text-white font-medium text-sm">
                              {item.name}
                            </div>
                            {item.attributes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.attributes.slice(0, 4).map((attr, attrIdx) => (
                                  <span key={attrIdx} className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">
                                    {attr}
                                  </span>
                                ))}
                                {item.attributes.length > 4 && (
                                  <span className="text-xs text-gray-400">
                                    +{item.attributes.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-purple-400 font-semibold">
                              {formatPrice(item.price)}
                            </div>
                            <div className="text-xs text-gray-400">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {warnings.length > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Import Warnings</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleImport}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                >
                  <Check className="w-5 h-5" />
                  Import {parsedItems.length} Memorabilia Items
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setParsedItems([]);
                    setWarnings([]);
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Back to Edit
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}