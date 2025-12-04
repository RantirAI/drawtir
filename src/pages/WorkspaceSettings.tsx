import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/components/Settings/AvatarUpload';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Palette, Save } from 'lucide-react';
import HorizontalNav from '@/components/Navigation/HorizontalNav';
import { usePermissions } from '@/hooks/usePermissions';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

export default function WorkspaceSettings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManageWorkspace } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState({
    name: '',
    description: '',
    avatar_url: '',
    primary_color: '#9b87f5',
  });

  useEffect(() => {
    if (!canManageWorkspace) {
      toast.error('You do not have permission to manage workspace settings');
      navigate('/workspaces');
      return;
    }

    fetchWorkspace();
  }, [id, canManageWorkspace]);

  const fetchWorkspace = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setWorkspace({
        name: data.name,
        description: data.description || '',
        avatar_url: data.avatar_url || '',
        primary_color: data.primary_color || '#9b87f5',
      });
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast.error('Failed to load workspace settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: workspace.name,
          description: workspace.description,
          avatar_url: workspace.avatar_url,
          primary_color: workspace.primary_color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Workspace settings updated!');
      navigate('/workspaces');
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-background">
      <HorizontalNav />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/workspaces')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Workspace Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize your workspace appearance and information
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your workspace name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  value={workspace.name}
                  onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                  placeholder="My Workspace"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workspace.description}
                  onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                  placeholder="A brief description of your workspace"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Workspace Avatar</Label>
                <AvatarUpload
                  currentAvatarUrl={workspace.avatar_url}
                  onUploadComplete={(url) => setWorkspace({ ...workspace, avatar_url: url })}
                  fallbackText={workspace.name?.[0]?.toUpperCase() || "W"}
                />
              </div>

              <div>
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={workspace.primary_color}
                    onChange={(e) => setWorkspace({ ...workspace, primary_color: e.target.value })}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={workspace.primary_color}
                    onChange={(e) => setWorkspace({ ...workspace, primary_color: e.target.value })}
                    placeholder="#9b87f5"
                    className="flex-1"
                  />
                </div>
                <div 
                  className="mt-3 h-12 rounded-lg border flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: workspace.primary_color }}
                >
                  Preview
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/workspaces')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !workspace.name}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
      </div>
    </SubscriptionGuard>
  );
}
