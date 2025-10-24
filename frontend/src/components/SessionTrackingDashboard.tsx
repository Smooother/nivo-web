import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Filter,
  TrendingUp,
  Building2,
  DollarSign,
  Users,
  Settings,
  Timer
} from 'lucide-react';

interface SessionInfo {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'error';
  stages: {
    stage1: {
      status: 'pending' | 'running' | 'completed' | 'error';
      companies: number;
      completedAt?: string;
    };
    stage2: {
      status: 'pending' | 'running' | 'completed' | 'error';
      companyIds: number;
      completedAt?: string;
    };
    stage3: {
      status: 'pending' | 'running' | 'completed' | 'error';
      financials: number;
      completedAt?: string;
    };
  };
  totalCompanies: number;
  totalCompanyIds: number;
  totalFinancials: number;
  filters?: any;
  progress?: {
    stage1Progress: number;
    stage2Progress: number;
    stage3Progress: number;
    overallProgress: number;
  };
}

interface SessionTrackingDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSessionSelect?: (sessionId: string) => void;
  selectedSessionId?: string;
}

const SessionTrackingDashboard: React.FC<SessionTrackingDashboardProps> = ({ 
  autoRefresh = false, 
  refreshInterval = 5000,
  onSessionSelect,
  selectedSessionId
}) => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(selectedSessionId || null);
  const [sessionDetails, setSessionDetails] = useState<SessionInfo | null>(null);
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(autoRefresh);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSessions = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('http://localhost:3000/api/sessions');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
        setLastUpdated(new Date());
        
        // Auto-select first session if none selected
        if (!selectedSession && data.sessions.length > 0) {
          const firstSession = data.sessions[0];
          setSelectedSession(firstSession.sessionId);
          if (onSessionSelect) {
            onSessionSelect(firstSession.sessionId);
          }
        }
      } else {
        console.error('Failed to fetch sessions:', data.error);
      }
      
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSessionDetails(data.session);
      } else {
        console.error('Failed to fetch session details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    if (enableAutoRefresh) {
      const interval = setInterval(fetchSessions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enableAutoRefresh, refreshInterval]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionDetails(selectedSession);
    }
  }, [selectedSession]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStageBadge = (stage: string, status: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full";
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>{stage}</span>;
      case 'running':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>{stage}</span>;
      case 'error':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>{stage}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-600`}>{stage}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  const getOverallProgress = (session: SessionInfo) => {
    const stages = [session.stages.stage1, session.stages.stage2, session.stages.stage3];
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return Math.round((completedStages / 3) * 100);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };

  const handleStageControl = async (stage: number, action: string) => {
    if (!selectedSession) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/stages/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          stage: stage.toString(),
          action: action
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh session details after starting stage
        fetchSessionDetails(selectedSession);
        console.log(`Stage ${stage} ${action} initiated:`, data.message);
      } else {
        console.error(`Failed to ${action} stage ${stage}:`, data.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing stage ${stage}:`, error);
    }
  };

  const getEstimatedTime = (session: SessionInfo) => {
    const totalCompanies = session.totalCompanies;
    if (totalCompanies === 0) return 'Unknown';
    
    // Rough estimates based on processing rates
    const stage1Time = Math.ceil(totalCompanies / 100); // 100 companies per minute
    const stage2Time = Math.ceil(totalCompanies / 200); // 200 companies per minute  
    const stage3Time = Math.ceil(totalCompanies / 50);  // 50 companies per minute
    
    const totalMinutes = stage1Time + stage2Time + stage3Time;
    
    if (totalMinutes < 60) {
      return `~${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `~${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scraping Sessions</h2>
          <p className="text-gray-600 mt-1">
            Track and monitor all scraping sessions across the 3-stage process
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchSessions}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Session Selection & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Session</label>
              <Select value={selectedSession || ''} onValueChange={handleSessionSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a session to monitor" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.sessionId} value={session.sessionId}>
                      <div className="flex items-center justify-between w-full">
                        <span>Session {session.sessionId.slice(0, 8)}...</span>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusBadge(session.status)}
                          <span className="text-xs text-gray-500">
                            {session.totalCompanies} companies
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={enableAutoRefresh}
                  onCheckedChange={setEnableAutoRefresh}
                />
                <label className="text-sm">Auto-refresh</label>
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest scraping sessions with 3-stage progress tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scraping sessions found</p>
                <p className="text-sm">Start a new scraping session to see it here</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.sessionId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(session.status)}
                      <div>
                        <div className="font-medium">Session {session.sessionId.slice(0, 8)}...</div>
                        <div className="text-sm text-gray-600">
                          Created: {formatDate(session.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(session.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSession(selectedSession === session.sessionId ? null : session.sessionId)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedSession === session.sessionId ? 'Hide' : 'View'}
                      </Button>
                    </div>
                  </div>

                  {/* 3-Stage Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{getOverallProgress(session)}%</span>
                    </div>
                    <Progress value={getOverallProgress(session)} className="w-full mb-3" />
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        {getStageBadge('Stage 1', session.stages.stage1.status)}
                        <span className="text-gray-500">({session.totalCompanies} companies)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStageBadge('Stage 2', session.stages.stage2.status)}
                        <span className="text-gray-500">({session.totalCompanyIds} IDs)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStageBadge('Stage 3', session.stages.stage3.status)}
                        <span className="text-gray-500">({session.totalFinancials} financials)</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  {selectedSession === session.sessionId && sessionDetails && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Stage 1: Segmentation</h4>
                          <div className="text-sm text-gray-600">
                            <div>Status: {sessionDetails.stages.stage1.status}</div>
                            <div>Companies: {sessionDetails.totalCompanies}</div>
                            {sessionDetails.stages.stage1.completedAt && (
                              <div>Completed: {formatDate(sessionDetails.stages.stage1.completedAt)}</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Stage 2: Enrichment</h4>
                          <div className="text-sm text-gray-600">
                            <div>Status: {sessionDetails.stages.stage2.status}</div>
                            <div>Company IDs: {sessionDetails.totalCompanyIds}</div>
                            {sessionDetails.stages.stage2.completedAt && (
                              <div>Completed: {formatDate(sessionDetails.stages.stage2.completedAt)}</div>
                            )}
                          </div>
                          {sessionDetails.stages.stage1.status === 'completed' && sessionDetails.stages.stage2.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStageControl(2, 'start')}
                              className="mt-2 flex items-center gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Start Stage 2
                            </Button>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Stage 3: Financials</h4>
                          <div className="text-sm text-gray-600">
                            <div>Status: {sessionDetails.stages.stage3.status}</div>
                            <div>Financial Records: {sessionDetails.totalFinancials}</div>
                            {sessionDetails.stages.stage3.completedAt && (
                              <div>Completed: {formatDate(sessionDetails.stages.stage3.completedAt)}</div>
                            )}
                          </div>
                          {sessionDetails.stages.stage2.status === 'completed' && sessionDetails.stages.stage3.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStageControl(3, 'start')}
                              className="mt-2 flex items-center gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Start Stage 3
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Performance Info */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Performance Estimate</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <div>Estimated total time: {getEstimatedTime(sessionDetails)}</div>
                          <div>Companies: {sessionDetails.totalCompanies} | 
                               Stage 2: {sessionDetails.totalCompanyIds} | 
                               Stage 3: {sessionDetails.totalFinancials}</div>
                        </div>
                      </div>
                      
                      {sessionDetails.filters && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">Filters Applied</h4>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <pre>{JSON.stringify(sessionDetails.filters, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionTrackingDashboard;
