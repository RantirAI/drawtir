-- Function to automatically add a workspace member when an invitation is accepted
create or replace function public.add_member_on_invitation_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when accepted_at transitions from null to a non-null value
  if new.accepted_at is not null and (old.accepted_at is null or new.accepted_at <> old.accepted_at) then
    -- Find user id by invited email
    perform 1 from public.profiles where email = new.email;
    if found then
      -- Insert member if not already present
      insert into public.workspace_members (workspace_id, user_id, role, invited_by)
      select new.workspace_id, p.id, new.role, new.invited_by
      from public.profiles p
      where p.email = new.email
      and not exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = new.workspace_id and wm.user_id = p.id
      );
    end if;
  end if;
  return new;
end;
$$;

-- Trigger to call the function after invitation updates
drop trigger if exists trg_add_member_on_invitation_accept on public.workspace_invitations;
create trigger trg_add_member_on_invitation_accept
after update on public.workspace_invitations
for each row
execute function public.add_member_on_invitation_accept();

-- Allow editors to manage invitations
create policy "Editors can update invitations"
on public.workspace_invitations
for update
using (
  has_workspace_role(auth.uid(), workspace_id, 'owner')
  or has_workspace_role(auth.uid(), workspace_id, 'editor')
);

create policy "Editors can delete invitations"
on public.workspace_invitations
for delete
using (
  has_workspace_role(auth.uid(), workspace_id, 'owner')
  or has_workspace_role(auth.uid(), workspace_id, 'editor')
);

-- Allow editors to manage members (except owners)
create policy "Editors can remove members"
on public.workspace_members
for delete
using (
  has_workspace_role(auth.uid(), workspace_id, 'editor') and role <> 'owner'
);

create policy "Editors can update member roles"
on public.workspace_members
for update
using (
  has_workspace_role(auth.uid(), workspace_id, 'editor') and role <> 'owner'
)
with check (role <> 'owner');
