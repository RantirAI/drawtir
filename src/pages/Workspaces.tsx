import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Users, Mail, Trash2, Crown, Settings, MoreVertical } from 'lucide-react';
import HorizontalNav from '@/components/Navigation/HorizontalNav';
import { ActivityLogPanel } from '@/components/Workspace/ActivityLogPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  member_count?: number;
  your_role?: string;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
  inviter: {
    email: string;
    display_name: string | null;
  } | null;
}

export default function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('editor');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchMembers(selectedWorkspace.id);
      fetchInvitations(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch workspaces where user is a member
      const { data: memberWorkspaces, error: membersError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(id, name, owner_id, created_at)')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      const workspacesData = memberWorkspaces?.map(m => ({
        ...(m.workspaces as any),
        your_role: m.role,
      })) || [];

      setWorkspaces(workspacesData);
      if (workspacesData.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(workspacesData[0]);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, joined_at, profiles!workspace_members_user_id_fkey(email, display_name, avatar_url)')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers((data as any) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    }
  };

  const fetchInvitations = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('id, email, role, created_at, accepted_at, expires_at, inviter:profiles!workspace_invitations_invited_by_fkey(email, display_name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data as any) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workspaceId, error } = await supabase
        .rpc('create_workspace_with_member', {
          workspace_name: newWorkspaceName,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Workspace created!');
      setNewWorkspaceName('');
      setShowCreateDialog(false);
      fetchWorkspaces();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !selectedWorkspace) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: selectedWorkspace.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteDialog(false);
      if (selectedWorkspace) {
        fetchInvitations(selectedWorkspace.id);
      }
    } catch (error: any) {
      console.error('Error sending invite:', error);
      if (error.code === '23505') {
        toast.error('An invitation for this email already exists');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      if (selectedWorkspace) {
        fetchMembers(selectedWorkspace.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'owner' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member role updated');
      if (selectedWorkspace) {
        fetchMembers(selectedWorkspace.id);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-primary text-primary-foreground';
      case 'editor':
        return 'bg-secondary text-secondary-foreground';
      case 'viewer':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInvitationStatus = (invitation: WorkspaceInvitation) => {
    if (invitation.accepted_at) {
      return { label: 'Accepted', color: 'bg-green-500/10 text-green-600 dark:text-green-400' };
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { label: 'Expired', color: 'bg-destructive/10 text-destructive' };
    }
    return { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
  };

  // Show only one invitation per email within this workspace.
  // Preference order: Accepted > Latest pending. This avoids showing older pending invites
  // after the user has already accepted.
  const dedupedInvitations = useMemo(() => {
    const groups = new Map<string, WorkspaceInvitation[]>();
    for (const inv of invitations) {
      const key = inv.email.toLowerCase();
      const arr = groups.get(key) || [];
      arr.push(inv);
      groups.set(key, arr);
    }

    const result: WorkspaceInvitation[] = [];
    groups.forEach((arr) => {
      const accepted = arr
        .filter((i) => i.accepted_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      if (accepted) {
        result.push(accepted);
      } else {
        const latest = arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        result.push(latest);
      }
    });

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [invitations]);

  const pendingCount = useMemo(
    () =>
      dedupedInvitations.filter(
        (i) => !i.accepted_at && new Date(i.expires_at) > new Date()
      ).length,
    [dedupedInvitations]
  );

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      if (selectedWorkspace) {
        fetchInvitations(selectedWorkspace.id);
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Collaborate with your team on design projects
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a workspace to collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="My Team Workspace"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createWorkspace}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/10">
            <CardHeader>
              <CardTitle className="text-lg">Your Workspaces</CardTitle>
              <CardDescription>Select a workspace to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {workspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workspaces yet. Create one to get started!
                </p>
              ) : (
                 workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => setSelectedWorkspace(workspace)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedWorkspace?.id === workspace.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'hover:bg-muted border-border/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {workspace.your_role}
                        </p>
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Members List */}
          {selectedWorkspace && (
            <Card className="lg:col-span-2 border-border/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedWorkspace.name}</CardTitle>
                    <CardDescription>
                      {members.length} member{members.length !== 1 ? 's' : ''} · {pendingCount} pending invitation{pendingCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedWorkspace.your_role === 'owner' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/workspaces/${selectedWorkspace.id}/settings`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Invite
                          </Button>
                        </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite to Workspace</DialogTitle>
                          <DialogDescription>
                            Send an invitation to collaborate on this workspace
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={sendInvite}>Send Invitation</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                  </div>
                </div>
              </CardHeader>
              
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="mx-6">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members">
              <CardContent>
                <div className="space-y-4">
                  {/* Active Members */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Members</h3>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/10"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.profiles?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(member.profiles?.display_name || member.profiles?.email || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.profiles?.display_name || member.profiles?.email || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.profiles?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                              {member.role === 'owner' && <Crown className="h-3 w-3 inline mr-1" />}
                              {member.role}
                            </div>
                            
                            {selectedWorkspace.your_role === 'owner' && member.role !== 'owner' && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="end">
                                  <div className="space-y-1">
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      Change Role
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-sm"
                                      onClick={() => updateMemberRole(member.id, 'editor')}
                                      disabled={member.role === 'editor'}
                                    >
                                      Editor
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-sm"
                                      onClick={() => updateMemberRole(member.id, 'viewer')}
                                      disabled={member.role === 'viewer'}
                                    >
                                      Viewer
                                    </Button>
                                    <div className="h-px bg-border my-1" />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => removeMember(member.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Remove
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invitations */}
                  {dedupedInvitations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Invitations</h3>
                      <div className="space-y-2">
                        {dedupedInvitations.map((invitation) => {
                          const status = getInvitationStatus(invitation);
                          return (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/10 bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    <Mail className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{invitation.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Invited by {invitation.inviter?.display_name || invitation.inviter?.email || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                                  {invitation.role}
                                </div>
                                
                                {selectedWorkspace.your_role === 'owner' && !invitation.accepted_at && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => cancelInvitation(invitation.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
                </TabsContent>
                
                <TabsContent value="activity">
                  <div className="p-6">
                    <ActivityLogPanel workspaceId={selectedWorkspace.id} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
