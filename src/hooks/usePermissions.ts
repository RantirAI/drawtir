import { useMemo } from 'react';
import { useWorkspaces } from './useWorkspaces';

export type Permission = 
  | 'view_projects'
  | 'create_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'invite_members'
  | 'manage_members'
  | 'manage_workspace';

export const usePermissions = () => {
  const { selectedWorkspace } = useWorkspaces();

  const permissions = useMemo(() => {
    if (!selectedWorkspace) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canInvite: false,
        canManageMembers: false,
        canManageWorkspace: false,
      };
    }

    const role = selectedWorkspace.your_role;

    return {
      canView: true, // All roles can view
      canCreate: role === 'owner' || role === 'editor',
      canEdit: role === 'owner' || role === 'editor',
      canDelete: role === 'owner' || role === 'editor',
      canInvite: role === 'owner',
      canManageMembers: role === 'owner',
      canManageWorkspace: role === 'owner',
    };
  }, [selectedWorkspace]);

  const hasPermission = (permission: Permission): boolean => {
    switch (permission) {
      case 'view_projects':
        return permissions.canView;
      case 'create_projects':
        return permissions.canCreate;
      case 'edit_projects':
        return permissions.canEdit;
      case 'delete_projects':
        return permissions.canDelete;
      case 'invite_members':
        return permissions.canInvite;
      case 'manage_members':
        return permissions.canManageMembers;
      case 'manage_workspace':
        return permissions.canManageWorkspace;
      default:
        return false;
    }
  };

  return {
    ...permissions,
    hasPermission,
    role: selectedWorkspace?.your_role || null,
  };
};
