import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Loader2 } from 'lucide-react';

interface MoveProjectDialogProps {
  projectId: string;
  projectName: string;
  currentWorkspaceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MoveProjectDialog({
  projectId,
  projectName,
  currentWorkspaceId,
  open,
  onOpenChange,
  onSuccess
}: MoveProjectDialogProps) {
  const { workspaces } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }

    setIsMoving(true);
    try {
      const { error } = await supabase
        .from('posters')
        .update({ workspace_id: selectedWorkspaceId === 'personal' ? null : selectedWorkspaceId })
        .eq('id', projectId);

      if (error) throw error;

      toast.success(`Project moved successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving project:', error);
      toast.error('Failed to move project');
    } finally {
      setIsMoving(false);
    }
  };

  // Filter out the current workspace
  const availableWorkspaces = workspaces.filter(w => w.id !== currentWorkspaceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Project</DialogTitle>
          <DialogDescription>
            Move "{projectName}" to another workspace
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination workspace" />
            </SelectTrigger>
            <SelectContent>
              {!currentWorkspaceId && (
                <SelectItem value="personal" disabled>
                  Personal Projects (current)
                </SelectItem>
              )}
              {currentWorkspaceId && (
                <SelectItem value="personal">
                  Personal Projects
                </SelectItem>
              )}
              {availableWorkspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving || !selectedWorkspaceId}>
            {isMoving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Moving...
              </>
            ) : (
              'Move Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
