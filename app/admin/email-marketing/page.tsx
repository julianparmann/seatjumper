'use client';

import { useState, useEffect } from 'react';
import {
  Send,
  Users,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  TestTube,
  Eye
} from 'lucide-react';

export default function EmailMarketingPage() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [sending, setSending] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    marketingOptIns: 0,
    emailsSentToday: 0,
    lastCampaign: null as any
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentCampaigns();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/email-marketing/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/email-marketing/campaigns');
      if (response.ok) {
        const data = await response.json();
        setRecentCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleSend = async () => {
    if (!subject || !content) {
      setMessage({ type: 'error', text: 'Subject and content are required' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/email-marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          ctaText: ctaText || undefined,
          ctaUrl: ctaUrl || undefined,
          previewText: previewText || undefined,
          testMode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: testMode
            ? `Test email sent to admin successfully!`
            : `Campaign sent successfully! ${data.sentCount} emails sent to ${data.recipientCount} users.`
        });
        // Clear form
        setSubject('');
        setContent('');
        setCtaText('');
        setCtaUrl('');
        setPreviewText('');
        setTestMode(false);
        // Refresh stats and campaigns
        fetchStats();
        fetchRecentCampaigns();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email campaign' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while sending the campaign' });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Email Marketing
        </h1>
        <p className="text-gray-400 text-lg">
          Send marketing emails to your users and track campaign performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          <p className="text-sm text-gray-400 mt-2">Registered Users</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Mail className="w-8 h-8 text-green-400" />
            <span className="text-xs text-gray-400">Opted In</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.marketingOptIns}</p>
          <p className="text-sm text-gray-400 mt-2">Marketing Subscribers</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Send className="w-8 h-8 text-yellow-400" />
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.emailsSentToday}</p>
          <p className="text-sm text-gray-400 mt-2">Emails Sent</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-gray-400">Last</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {stats.lastCampaign ? formatDate(stats.lastCampaign.sentAt) : 'No campaigns yet'}
          </p>
          <p className="text-sm text-gray-400 mt-2">Last Campaign</p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-400' :
          message.type === 'error' ? 'bg-red-500/20 border border-red-500 text-red-400' :
          'bg-blue-500/20 border border-blue-500 text-blue-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Email Composer */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Compose Campaign</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Mode Toggle */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <input
              type="checkbox"
              id="testMode"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
            />
            <label htmlFor="testMode" className="flex items-center gap-2 cursor-pointer">
              <TestTube className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Test Mode</span>
              <span className="text-gray-400 text-sm">(Send only to admin email)</span>
            </label>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject Line *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preview Text
              <span className="text-gray-500 text-xs ml-2">(Shows in inbox preview)</span>
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Enter preview text..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your email content here..."
              rows={10}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Call to Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CTA Button Text
                <span className="text-gray-500 text-xs ml-2">(Optional)</span>
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g., Browse Events"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CTA Button URL
                <span className="text-gray-500 text-xs ml-2">(Required if CTA text is set)</span>
              </label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://seatjumper.com/events"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSend}
              disabled={sending || !subject || !content}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                sending || !subject || !content
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : testMode
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : testMode ? (
                <>
                  <TestTube className="w-5 h-5" />
                  Send Test Email
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to All Subscribers
                </>
              )}
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={!subject || !content}
              className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-5 h-5" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview */}
      {showPreview && subject && content && (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Email Preview</h3>
          </div>
          <div className="p-6">
            <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
              <div className="border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{subject}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">Hi [User Name],</p>
                {content.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700">{paragraph}</p>
                ))}
                {ctaText && ctaUrl && (
                  <div className="text-center py-4">
                    <a
                      href="#"
                      className="inline-block px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg"
                      onClick={(e) => e.preventDefault()}
                    >
                      {ctaText}
                    </a>
                  </div>
                )}
                <div className="border-t pt-4 mt-6">
                  <p className="text-sm text-gray-500 text-center">
                    You received this email because you opted in to marketing communications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Recent Campaigns</h2>
        </div>

        {recentCampaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Sent To</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{campaign.subject}</p>
                      {campaign.previewText && (
                        <p className="text-sm text-gray-400 mt-1">{campaign.previewText}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{campaign.sentCount} / {campaign.recipientCount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'SENT' ? 'bg-green-500/20 text-green-400' :
                        campaign.status === 'SENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        campaign.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(campaign.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No campaigns sent yet</p>
          </div>
        )}
      </div>
    </div>
  );
}