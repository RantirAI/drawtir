

## Plan: Comments & Approval Flow Implementation

### Phase 1: Database Schema

**1. Create `poster_comments` table:**
```sql
- id (uuid, primary key)
- poster_id (uuid, FK to posters)
- user_id (uuid, FK to profiles)
- content (text) -- comment text
- parent_id (uuid, nullable) -- for threaded replies
- position_x (numeric, nullable) -- for canvas annotations
- position_y (numeric, nullable) -- for canvas annotations
- frame_id (text, nullable) -- specific frame the comment is on
- resolved (boolean, default false)
- resolved_by (uuid, nullable)
- resolved_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**2. Create `poster_approvals` table:**
```sql
- id (uuid, primary key)
- poster_id (uuid, FK to posters, unique)
- status (enum: 'draft', 'pending_review', 'changes_requested', 'approved', 'published')
- submitted_by (uuid) -- who submitted for review
- submitted_at (timestamptz)
- reviewed_by (uuid, nullable)
- reviewed_at (timestamptz, nullable)
- review_notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**3. Create `comment_mentions` table:**
```sql
- id (uuid, primary key)
- comment_id (uuid, FK to poster_comments)
- mentioned_user_id (uuid, FK to profiles)
- created_at (timestamptz)
```

**4. Add RLS policies** for workspace-based access control on all new tables.

### Phase 2: Comments Feature

1. **CommentsPanel component** - Sidebar panel showing all comments for a poster
2. **CommentThread component** - Display threaded comment conversations
3. **CommentInput component** - Rich text input with @mention support
4. **CanvasCommentMarker component** - Visual markers on canvas for positioned comments
5. **useComments hook** - Real-time subscription to comments
6. **Comment resolution** - Mark comments as resolved

### Phase 3: Approval Workflow

1. **ApprovalStatusBadge component** - Visual indicator of approval status
2. **ApprovalPanel component** - UI for submitting/reviewing projects
3. **ApprovalActions component** - Approve/Request Changes/Reject buttons
4. **useApproval hook** - Manage approval state and transitions
5. **Activity log integration** - Log all approval state changes
6. **Email notifications (optional)** - Edge function to notify reviewers

### Phase 4: UI Integration

1. Add "Comments" button to editor toolbar
2. Add approval status indicator to gallery cards
3. Add "Submit for Review" action for editors
4. Add "Review Queue" view for workspace owners/admins
5. Filter gallery by approval status

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   DRAFT ──► PENDING_REVIEW ──┬──► APPROVED ──► PUBLISHED   │
│     ▲                        │                              │
│     │                        ▼                              │
│     └─────────── CHANGES_REQUESTED                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Permissions:
• Editor: Can create, edit, submit for review
• Owner: Can approve, request changes, publish
• Viewer: Can view and comment only
```

### Files to Create/Modify

**New Files:**
- `src/components/Comments/CommentsPanel.tsx`
- `src/components/Comments/CommentThread.tsx`
- `src/components/Comments/CommentInput.tsx`
- `src/components/Comments/CanvasCommentMarker.tsx`
- `src/components/Approval/ApprovalPanel.tsx`
- `src/components/Approval/ApprovalStatusBadge.tsx`
- `src/hooks/useComments.ts`
- `src/hooks/useApproval.ts`

**Modified Files:**
- `src/pages/Editor.tsx` - Add comments toggle
- `src/pages/Gallery.tsx` - Add approval status filter
- `src/components/Canvas/CanvasContainerNew.tsx` - Add comment markers
- `src/components/TopBar/EditorTopBar.tsx` - Add comments button
- `src/hooks/useActivityLog.ts` - Add approval/comment actions

