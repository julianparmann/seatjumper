'use client';

import { useState } from 'react';
import { FileText, Upload, AlertCircle, Check, X, Eye, Ticket } from 'lucide-react';
import {
  parseTicketData,
  generateTicketGroupInputs,
  groupTicketsForPreview,
  calculateStats,
  validateParsedTickets,
  formatPrice,
  type ParsedTicket
} from '@/lib/utils/ticket-parser';

interface BulkTicketParserProps {
  onImport: (ticketGroups: any[]) => void;
  onCancel: () => void;
}

export default function BulkTicketParser({ onImport, onCancel }: BulkTicketParserProps) {
  const [rawData, setRawData] = useState('');
  const [parsedTickets, setParsedTickets] = useState<ParsedTicket[]>([]);
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

  const handleImport = () => {
    const ticketGroupInputs = generateTicketGroupInputs(parsedTickets);
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
  incl. fees

Section 303
Row 9
2 tickets together
Clear view
Only 4 left
$463
Now
$259
  incl. fees

Section 117
Row 19
2 tickets together
Zone: Lower Sideline
$386
  incl. fees

Section C131
Row 23 | Seats 1 - 2
2 tickets together
Stadium club
Clear view
$594
  incl. fees`;

    setRawData(exampleData);
  };

  const stats = showPreview ? calculateStats(parsedTickets) : null;
  const groupedTickets = showPreview ? groupTicketsForPreview(parsedTickets) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Bulk Ticket Import</h2>
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
                  Paste your ticket data below. Each ticket will be imported as a unique entry.
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
                placeholder="Paste your ticket data here...

Example format:
Section 406
Row 3
2 tickets together
$237 incl. fees

Section 421
Row 5
2 tickets together
$253 incl. fees
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
                  <span className="font-semibold">Successfully Parsed {parsedTickets.length} Individual Tickets</span>
                </div>
                <p className="text-sm text-green-300">
                  Each ticket will be stored separately and assigned to winners individually
                </p>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Tickets</div>
                    <div className="text-2xl font-bold text-white">{stats.totalTickets}</div>
                    <div className="text-xs text-gray-400 mt-1">{stats.totalSeats} total seats</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Average Price</div>
                    <div className="text-2xl font-bold text-purple-400">{formatPrice(stats.avgPrice)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatPrice(stats.minPrice)} - {formatPrice(stats.maxPrice)}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Sections</div>
                    <div className="text-2xl font-bold text-white">{stats.uniqueSections}</div>
                    <div className="text-xs text-gray-400 mt-1">unique sections</div>
                  </div>
                </div>
              )}

              {/* Grouped Preview */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Preview by Level</h3>

                {groupedTickets && Array.from(groupedTickets.entries()).map(([levelName, tickets]) => (
                  <div key={levelName} className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-purple-400" />
                        {levelName}
                      </h4>
                      <span className="text-sm text-gray-400">
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                      {tickets.map((ticket, idx) => (
                        <div key={idx} className="bg-black/30 rounded p-2 text-sm">
                          <div className="text-white font-medium">
                            Section {ticket.section}, Row {ticket.row}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {ticket.quantity} seat{ticket.quantity !== 1 ? 's' : ''} • {formatPrice(ticket.price)}
                            {ticket.isDiscounted && (
                              <span className="text-green-400 ml-1">
                                (was {formatPrice(ticket.originalPrice || 0)})
                              </span>
                            )}
                          </div>
                          {ticket.seats && (
                            <div className="text-gray-500 text-xs">
                              Seats {ticket.seats}
                            </div>
                          )}
                          {ticket.attributes.length > 0 && (
                            <div className="text-purple-400 text-xs mt-1">
                              {ticket.attributes.slice(0, 2).join(', ')}
                              {ticket.attributes.length > 2 && ` +${ticket.attributes.length - 2}`}
                            </div>
                          )}
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
                  Import {parsedTickets.length} Individual Tickets
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setParsedTickets([]);
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