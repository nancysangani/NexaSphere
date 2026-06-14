import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Award,
  Clock,
  Users,
  BookOpen,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { mentors as fallbackMentors, mentorDomains } from '../../data/mentorshipData.js';

const API_BASE = process.env.REACT_APP_API_URL || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(null);
  const [requestForm, setRequestForm] = useState({
    mentee_name: '',
    mentee_email: '',
    mentee_domain: '',
    mentee_goals: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (domainFilter) params.set('domain', domainFilter);
      params.set('limit', '50');
      const data = await apiFetch(`/api/mentorship/mentors?${params}`);
      setMentors(data.mentors || []);
    } catch {
      const filtered = fallbackMentors.filter((m) => {
        const bySearch =
          !search.trim() ||
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.bio.toLowerCase().includes(search.toLowerCase()) ||
          m.domains.some((d) => d.toLowerCase().includes(search.toLowerCase()));
        const byDomain = !domainFilter || m.domains.includes(domainFilter);
        return m.isAvailable && bySearch && byDomain;
      });
      setMentors(filtered);
    } finally {
      setLoading(false);
    }
  }, [search, domainFilter]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleRequest = async (mentorId) => {
    setSubmitting(true);
    try {
      await apiFetch('/api/mentorship/requests', {
        method: 'POST',
        body: JSON.stringify({ ...requestForm, mentor_id: mentorId }),
      });
      showToast('Mentorship request sent successfully!', 'success');
      setShowRequestForm(null);
      setRequestForm({
        mentee_name: '',
        mentee_email: '',
        mentee_domain: '',
        mentee_goals: '',
        message: '',
      });
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Find Your Mentor
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Connect with experienced mentors who can guide you through your learning journey. Browse
            our directory and request a mentorship today.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search mentors by name, skills, or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All Domains</option>
              {mentorDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No mentors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                      {mentor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{mentor.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Award className="w-3.5 h-3.5" />
                        <span>{mentor.experience || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  {mentor.isAvailable ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Unavailable
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{mentor.bio}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mentor.domains.map((d) => (
                    <span
                      key={d}
                      className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {mentor.availability && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{mentor.availability}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {mentor.menteeCount || 0} mentees
                  </span>
                </div>

                <button
                  onClick={() =>
                    setShowRequestForm(showRequestForm === mentor.id ? null : mentor.id)
                  }
                  disabled={!mentor.isAvailable}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showRequestForm === mentor.id ? 'Cancel' : 'Request Mentorship'}
                </button>

                {showRequestForm === mentor.id && (
                  <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                    <input
                      placeholder="Your Name *"
                      value={requestForm.mentee_name}
                      onChange={(e) =>
                        setRequestForm((p) => ({ ...p, mentee_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      placeholder="Your Email *"
                      type="email"
                      value={requestForm.mentee_email}
                      onChange={(e) =>
                        setRequestForm((p) => ({ ...p, mentee_email: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      placeholder="Domain (optional)"
                      value={requestForm.mentee_domain}
                      onChange={(e) =>
                        setRequestForm((p) => ({ ...p, mentee_domain: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <textarea
                      placeholder="Your goals (optional)"
                      rows={2}
                      value={requestForm.mentee_goals}
                      onChange={(e) =>
                        setRequestForm((p) => ({ ...p, mentee_goals: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <textarea
                      placeholder="Message to mentor (optional)"
                      rows={2}
                      value={requestForm.message}
                      onChange={(e) => setRequestForm((p) => ({ ...p, message: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <button
                      onClick={() => handleRequest(mentor.id)}
                      disabled={submitting || !requestForm.mentee_name || !requestForm.mentee_email}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MentorsPage;
