

## Plan: Comments & Approval Flow Implementation

### ✅ Phase 1: Database Schema (COMPLETED)

**Created:**
- `poster_comments` table with RLS policies
- `poster_approvals` table with RLS policies  
- `comment_mentions` table with RLS policies
- `approval_status` enum ('draft', 'pending_review', 'changes_requested', 'approved', 'published')
- Helper functions: `can_access_poster()`, `can_edit_poster()`
- Realtime enabled for both tables

### ✅ Phase 2: Comments Feature (COMPLETED)

**Created:**
- `src/hooks/useComments.ts` - Real-time comments hook with CRUD + resolution
- `src/components/Comments/CommentsPanel.tsx` - Sidebar panel with filtering
- `src/components/Comments/CommentThread.tsx` - Threaded conversations
- `src/components/Comments/CommentInput.tsx` - @mention support for workspace members

### ✅ Phase 3: Approval Workflow (COMPLETED)

**Created:**
- `src/hooks/useApproval.ts` - Approval state management
- `src/components/Approval/ApprovalPanel.tsx` - Submit/Review/Approve UI
- `src/components/Approval/ApprovalStatusBadge.tsx` - Visual status indicators

### ✅ Phase 4: UI Integration (PARTIALLY COMPLETED)

**Completed:**
- Added "Comments" button to EditorTopBar with badge for unresolved count
- Integrated CommentsPanel in CanvasContainerNew

**Remaining (optional):**
- Add approval status indicator to gallery cards
- Add "Submit for Review" action in editor sidebar
- Add "Review Queue" view for workspace owners/admins
- Filter gallery by approval status

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
