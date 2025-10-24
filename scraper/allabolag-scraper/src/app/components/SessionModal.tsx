'use client';

import { useState, useEffect } from 'react';

interface SessionInfo {
  sessionId: string;
  status: string;
  totalCompanies: number;
  totalCompanyIds: number;
  totalFinancials: number;
  createdAt: string;
  updatedAt: string;
  filters?: any;
  stages: {
    stage1: { status: string; completedAt?: string };
    stage2: { status: string; completedAt?: string };
    stage3: { status: string; completedAt?: string };
  };
}

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSelect: (sessionId: string) => void;
}

export default function SessionModal({ isOpen, onClose, onSessionSelect }: SessionModalProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleString('sv-SE');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getEstimatedTime = (session: SessionInfo) => {
    const totalCompanies = session.totalCompanies;
    if (totalCompanies < 100) return '5-10 minutes';
    if (totalCompanies < 1000) return '15-30 minutes';
    if (totalCompanies < 5000) return '1-2 hours';
    return '2+ hours';
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  const handleConfirmSelection = () => {
    if (selectedSession) {
      onSessionSelect(selectedSession);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Select Scraping Session</h2>
                <p className="text-blue-100 text-sm mt-1">Choose a session to monitor and manage</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSessions}
                  disabled={loading}
                  className="text-white hover:text-blue-200 transition-colors disabled:opacity-50"
                  title="Refresh sessions"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sessions...</p>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
                <p className="text-gray-600">Start a new scraping session to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedSession === session.sessionId
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleSessionClick(session.sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedSession === session.sessionId
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSession === session.sessionId && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Session {session.sessionId.slice(0, 8)}...
                          </h3>
                          <p className="text-sm text-gray-600">
                            Created: {formatDate(session.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(session.status)}
                          <span className="text-sm text-gray-600">
                            {session.totalCompanies} companies
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Stages:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.stages?.stage1?.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.stages?.stage1?.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            session.stages?.stage1?.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Stage 1: {session.stages?.stage1?.status || 'pending'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.stages?.stage2?.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.stages?.stage2?.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            session.stages?.stage2?.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Stage 2: {session.stages?.stage2?.status || 'pending'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.stages?.stage3?.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.stages?.stage3?.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            session.stages?.stage3?.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Stage 3: {session.stages?.stage3?.status || 'pending'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Est. time: {getEstimatedTime(session)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSession ? `Selected: ${selectedSession.slice(0, 8)}...` : 'No session selected'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedSession}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Select Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
