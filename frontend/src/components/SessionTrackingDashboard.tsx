import React, { useState, useEffect, useMemo } from 'react';
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
  Play,
  RotateCcw,
  Eye,
  Settings,
  Timer,
  Activity,
  PauseCircle,
  PlayCircle,
  StopCircle,
  ActivitySquare,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  CalendarClock
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

interface MonitoringStageProgress {
  completed: number;
  total: number;
  percentage: number;
  ratePerMinute?: number;
  etaMinutes?: number;
  lastUpdated?: string;
}

interface MonitoringData {
  jobId: string;
  timestamp: string;
  status: {
    current: string;
    isRunning: boolean;
    isCompleted: boolean;
  };
  progress?: {
    total?: {
      companies?: number;
      companyIds?: number;
      financials?: number;
    };
    rates?: {
      companiesPerMinute?: number;
      idsPerMinute?: number;
      financialsPerMinute?: number;
    };
    etaMinutes?: number;
    estimatedCompletionTime?: string;
  };
  stages?: {
    stage1?: MonitoringStageProgress;
    stage2?: MonitoringStageProgress;
    stage3?: MonitoringStageProgress;
  };
  errors?: {
    total?: number;
    byStage?: {
      stage1?: number;
      stage2?: number;
      stage3?: number;
    };
    byType?: Record<string, number>;
    recent?: Array<{
      id: string;
      companyName?: string;
      orgnr?: string;
      stage: 'stage1' | 'stage2' | 'stage3';
      errorType: string;
      message: string;
      occurredAt: string;
      retryable?: boolean;
    }>;
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
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [processActionLoading, setProcessActionLoading] = useState<null | 'pause' | 'resume' | 'stop' | 'restart'>(null);
  const [retryingErrorId, setRetryingErrorId] = useState<string | null>(null);

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
        await fetchMonitoringData(sessionId);
      } else {
        console.error('Failed to fetch session details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const fetchMonitoringData = async (sessionId: string) => {
    try {
      setMonitoringLoading(true);
      const response = await fetch(`http://localhost:3000/api/monitoring/dashboard?jobId=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Monitoring request failed with status ${response.status}`);
      }

      const data = await response.json();
      setMonitoringData(data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setMonitoringData(null);
    } finally {
      setMonitoringLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    if (enableAutoRefresh) {
      const interval = setInterval(() => {
        fetchSessions();
        if (selectedSession) {
          fetchSessionDetails(selectedSession);
        }
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [enableAutoRefresh, refreshInterval, selectedSession]);

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

  const handleProcessControl = async (action: 'pause' | 'resume' | 'stop' | 'restart') => {
    if (!selectedSession) return;

    try {
      setProcessActionLoading(action);
      const response = await fetch('http://localhost:3000/api/monitoring/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedSession,
          action,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || `Failed to ${action} job ${selectedSession}`);
      }

      await fetchSessionDetails(selectedSession);
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setProcessActionLoading(null);
    }
  };

  const handleRetryError = async (errorId: string) => {
    if (!selectedSession) return;

    try {
      setRetryingErrorId(errorId);
      const response = await fetch(`http://localhost:3000/api/sessions/${selectedSession}/errors/${errorId}/retry`, {
        method: 'POST',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || 'Retry request failed');
      }

      await fetchMonitoringData(selectedSession);
      await fetchSessionDetails(selectedSession);
    } catch (error) {
      console.error('Error retrying failure:', error);
    } finally {
      setRetryingErrorId(null);
    }
  };

  const getStageDisplayName = (stage: 'stage1' | 'stage2' | 'stage3') => {
    switch (stage) {
      case 'stage1':
        return 'Stage 1: Segmentation';
      case 'stage2':
        return 'Stage 2: Company IDs';
      case 'stage3':
        return 'Stage 3: Financials';
      default:
        return stage;
    }
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return `${Math.round(value)}%`;
  };

  const getSessionStage = (stage: 'stage1' | 'stage2' | 'stage3') => {
    if (!sessionDetails) return undefined;
    return sessionDetails.stages[stage];
  };

  const stageMetrics = useMemo(() => {
    return [
      {
        key: 'stage1' as const,
        label: 'Stage 1: Segmentation',
        progress: monitoringData?.stages?.stage1?.percentage ?? sessionDetails?.progress?.stage1Progress,
        completed: monitoringData?.stages?.stage1?.completed ?? sessionDetails?.totalCompanies,
        total: monitoringData?.stages?.stage1?.total ?? sessionDetails?.totalCompanies,
        rate: monitoringData?.progress?.rates?.companiesPerMinute,
        eta: monitoringData?.stages?.stage1?.etaMinutes,
      },
      {
        key: 'stage2' as const,
        label: 'Stage 2: Company IDs',
        progress: monitoringData?.stages?.stage2?.percentage ?? sessionDetails?.progress?.stage2Progress,
        completed: monitoringData?.stages?.stage2?.completed ?? sessionDetails?.totalCompanyIds,
        total: monitoringData?.stages?.stage2?.total ?? sessionDetails?.totalCompanies,
        rate: monitoringData?.progress?.rates?.idsPerMinute,
        eta: monitoringData?.stages?.stage2?.etaMinutes,
      },
      {
        key: 'stage3' as const,
        label: 'Stage 3: Financials',
        progress: monitoringData?.stages?.stage3?.percentage ?? sessionDetails?.progress?.stage3Progress,
        completed: monitoringData?.stages?.stage3?.completed ?? sessionDetails?.totalFinancials,
        total: monitoringData?.stages?.stage3?.total ?? sessionDetails?.totalCompanyIds,
        rate: monitoringData?.progress?.rates?.financialsPerMinute,
        eta: monitoringData?.stages?.stage3?.etaMinutes,
      },
    ];
  }, [monitoringData, sessionDetails]);

  const isRunning = monitoringData?.status?.isRunning ?? sessionDetails?.status === 'active';
  const isCompleted = monitoringData?.status?.isCompleted ?? sessionDetails?.status === 'completed';
  const estimatedMinutesRemaining = monitoringData?.progress?.etaMinutes;
  const estimatedCompletionTime = monitoringData?.progress?.estimatedCompletionTime;
  const formattedEta = useMemo(() => {
    if (estimatedMinutesRemaining === undefined || estimatedMinutesRemaining === null) {
      return '—';
    }

    if (estimatedMinutesRemaining < 60) {
      return `~${Math.max(1, Math.round(estimatedMinutesRemaining))} min`;
    }

    const hours = Math.floor(estimatedMinutesRemaining / 60);
    const minutes = Math.round(estimatedMinutesRemaining % 60);
    return `~${hours}h ${minutes}m`;
  }, [estimatedMinutesRemaining]);

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
                    <div className="mt-4 pt-4 border-t space-y-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                            <ActivitySquare className="h-3 w-3" />
                            <span>
                              Last update:{' '}
                              {monitoringData?.timestamp
                                ? new Date(monitoringData.timestamp).toLocaleString('sv-SE')
                                : formatDate(sessionDetails.updatedAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                              {getStatusIcon(monitoringData?.status?.current || sessionDetails.status)}
                              <span className="capitalize">
                                {(monitoringData?.status?.current || sessionDetails.status || '').replace(/_/g, ' ')}
                              </span>
                            </div>
                            {getStatusBadge(sessionDetails.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-4 w-4 text-muted-foreground" />
                              ETA: {formattedEta}
                            </span>
                            {estimatedCompletionTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Est. completion{' '}
                                {new Date(estimatedCompletionTime).toLocaleString('sv-SE')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              Overall progress {formatPercentage(sessionDetails.progress?.overallProgress)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {isRunning && !isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessControl('pause')}
                              disabled={processActionLoading !== null}
                              className="flex items-center gap-2"
                            >
                              {processActionLoading === 'pause' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <PauseCircle className="h-4 w-4" />
                              )}
                              Pause
                            </Button>
                          )}

                          {!isRunning && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessControl('resume')}
                              disabled={processActionLoading !== null}
                              className="flex items-center gap-2"
                            >
                              {processActionLoading === 'resume' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                              Resume
                            </Button>
                          )}

                          {!isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessControl('stop')}
                              disabled={processActionLoading !== null}
                              className="flex items-center gap-2"
                            >
                              {processActionLoading === 'stop' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <StopCircle className="h-4 w-4" />
                              )}
                              Stop
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessControl('restart')}
                            disabled={processActionLoading !== null}
                            className="flex items-center gap-2"
                          >
                            {processActionLoading === 'restart' ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Restart
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <BarChart2 className="h-4 w-4" />
                            Stage performance
                          </div>
                          {monitoringLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Updating metrics...
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {stageMetrics.map((stage) => {
                                const stageInfo = getSessionStage(stage.key);
                                const canTriggerStage = stage.key === 'stage2'
                                  ? getSessionStage('stage1')?.status === 'completed'
                                  : stage.key === 'stage3'
                                    ? getSessionStage('stage2')?.status === 'completed'
                                    : false;
                                return (
                                  <Card key={stage.key} className="border-gray-200">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-semibold text-gray-900">
                                        {stage.label}
                                      </CardTitle>
                                      <CardDescription className="flex items-center gap-2">
                                        {getStageBadge(stage.label, stageInfo?.status || 'pending')}
                                        <span className="text-xs text-gray-500">
                                          {stageInfo?.status?.toUpperCase() || 'PENDING'}
                                        </span>
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div>
                                        <Progress value={stage.progress ?? 0} className="mb-2" />
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                          <span>{formatPercentage(stage.progress)}</span>
                                          <span>
                                            {formatNumber(stage.completed ?? 0)} /{' '}
                                            {stage.total ? formatNumber(stage.total) : '—'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                                        <div className="flex items-center justify-between">
                                          <span>Rate</span>
                                          <span className="font-medium text-gray-900">
                                            {stage.rate ? `${stage.rate.toFixed(1)}/min` : '—'}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span>ETA</span>
                                          <span className="font-medium text-gray-900">
                                            {stage.eta ? `${Math.round(stage.eta)} min` : '—'}
                                          </span>
                                        </div>
                                        {stageInfo?.completedAt && (
                                          <div className="flex items-center justify-between">
                                            <span>Completed</span>
                                            <span>{formatDate(stageInfo.completedAt)}</span>
                                          </div>
                                        )}
                                      </div>
                                      {stageInfo?.status === 'pending' && stage.key !== 'stage1' && canTriggerStage && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStageControl(stage.key === 'stage2' ? 2 : 3, 'start')}
                                          className="w-full flex items-center justify-center gap-2"
                                        >
                                          <Play className="h-3 w-3" />
                                          Start {stage.label.split(':')[0]}
                                        </Button>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold">Throughput & timing</CardTitle>
                              <CardDescription>Real-time processing rates</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-xs uppercase text-gray-500">Stage 1</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {monitoringData?.progress?.rates?.companiesPerMinute
                                    ? `${monitoringData.progress.rates.companiesPerMinute.toFixed(1)}`
                                    : '—'}
                                </div>
                                <div className="text-xs text-gray-500">companies / min</div>
                              </div>
                              <div>
                                <div className="text-xs uppercase text-gray-500">Stage 2</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {monitoringData?.progress?.rates?.idsPerMinute
                                    ? `${monitoringData.progress.rates.idsPerMinute.toFixed(1)}`
                                    : '—'}
                                </div>
                                <div className="text-xs text-gray-500">IDs / min</div>
                              </div>
                              <div>
                                <div className="text-xs uppercase text-gray-500">Stage 3</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {monitoringData?.progress?.rates?.financialsPerMinute
                                    ? `${monitoringData.progress.rates.financialsPerMinute.toFixed(1)}`
                                    : '—'}
                                </div>
                                <div className="text-xs text-gray-500">records / min</div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold">Session totals</CardTitle>
                              <CardDescription>Processed entities across stages</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-xs uppercase text-gray-500">Companies</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatNumber(sessionDetails.totalCompanies)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs uppercase text-gray-500">Company IDs</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatNumber(sessionDetails.totalCompanyIds)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs uppercase text-gray-500">Financials</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatNumber(sessionDetails.totalFinancials)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {monitoringData?.errors && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Error monitoring
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-900">Active errors</CardTitle>
                                <CardDescription>Issues requiring attention</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-red-600">
                                  {monitoringData.errors.total ?? 0}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Across all stages</p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-900">By stage</CardTitle>
                                <CardDescription>Distribution of failures</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                {(['stage1', 'stage2', 'stage3'] as const).map((stage) => (
                                  <div key={stage} className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {getStageDisplayName(stage)}
                                      </Badge>
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {monitoringData.errors?.byStage?.[stage] ?? 0}
                                    </span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-900">By type</CardTitle>
                                <CardDescription>Top error categories</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm text-gray-600">
                                {monitoringData.errors.byType &&
                                  Object.entries(monitoringData.errors.byType)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([type, count]) => (
                                      <div key={type} className="flex items-center justify-between">
                                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                                        <span className="font-medium text-gray-900">{count}</span>
                                      </div>
                                    ))}
                                {(!monitoringData.errors.byType || Object.keys(monitoringData.errors.byType).length === 0) && (
                                  <div className="text-xs text-gray-400">No error data available</div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {monitoringData.errors.recent && monitoringData.errors.recent.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-900">Recent errors</CardTitle>
                                <CardDescription>Latest retryable failures</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {monitoringData.errors.recent.map((error) => (
                                  <div
                                    key={error.id}
                                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center md:justify-between"
                                  >
                                    <div className="space-y-1">
                                      <div className="font-medium text-gray-900">
                                        {error.companyName || 'Unknown company'}
                                        {error.orgnr && (
                                          <span className="ml-2 font-mono text-xs text-gray-500">{error.orgnr}</span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {error.message}
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Badge variant="outline" className="text-xs">
                                            {getStageDisplayName(error.stage)}
                                          </Badge>
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          {error.errorType.replace(/_/g, ' ')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {new Date(error.occurredAt).toLocaleString('sv-SE')}
                                        </span>
                                      </div>
                                    </div>
                                    {error.retryable !== false && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRetryError(error.id)}
                                        disabled={retryingErrorId === error.id}
                                        className="mt-2 md:mt-0"
                                      >
                                        {retryingErrorId === error.id ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ArrowRight className="h-4 w-4 mr-1" />
                                        )}
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {sessionDetails.filters && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Filters applied</CardTitle>
                            <CardDescription>Source criteria for this session</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                              {JSON.stringify(sessionDetails.filters, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
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
