import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Users, CheckCircle, XCircle, Clock, Shield, Mail, Calendar } from 'lucide-react';
import { supabase, supabaseConfig } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'approved' | 'pending';
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

interface AdminPanelProps {
  currentUser: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabaseEnabled = supabaseConfig.isConfigured;

  // Fetch all users
  const fetchUsers = async () => {
    if (!supabaseEnabled) {
      setUsers([
        {
          id: 'local-demo-admin',
          email: 'demo@nivo.ai',
          role: 'admin',
          created_at: new Date().toISOString(),
          approved_by: 'system',
          approved_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      
      // Fallback: If we can't fetch from database, show current user as admin
      if (currentUser?.email === 'jesper@rgcapital.se') {
        setUsers([{
          id: 'fallback-admin',
          user_id: currentUser.id,
          role: 'admin' as const,
          approved_by: 'system',
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [supabaseEnabled]);

  // Approve user
  const approveUser = async (userId: string) => {
    if (!supabaseEnabled) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      setSuccess('User approved successfully!');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject user
  const rejectUser = async (userId: string) => {
    if (!supabaseEnabled) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setSuccess('User rejected and removed!');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Make user admin
  const makeAdmin = async (userId: string) => {
    if (!supabaseEnabled) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: 'admin',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      setSuccess('User promoted to admin!');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-red-500"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingUsers = users.filter(user => user.role === 'pending');
  const approvedUsers = users.filter(user => user.role === 'approved');
  const adminUsers = users.filter(user => user.role === 'admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Administration</h2>
          <p className="text-gray-600">Manage user access and permissions</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Pending Approval ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              New users waiting for your approval to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Signed up: {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(user.role)}
                    <Button
                      size="sm"
                      onClick={() => approveUser(user.id)}
                      disabled={!supabaseEnabled || actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectUser(user.id)}
                      disabled={!supabaseEnabled || actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            All Users ({users.length})
          </CardTitle>
          <CardDescription>
            Complete list of all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Joined: {formatDate(user.created_at)}</span>
                      {user.approved_at && (
                        <>
                          <span>•</span>
                          <span>Approved: {formatDate(user.approved_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleBadge(user.role)}
                  {user.role === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => makeAdmin(user.id)}
                      disabled={!supabaseEnabled || actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-1" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
