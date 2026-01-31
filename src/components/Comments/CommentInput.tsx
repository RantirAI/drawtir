import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceMember {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  workspaceId?: string | null;
  disabled?: boolean;
}

export const CommentInput = ({
  onSubmit,
  placeholder = 'Add a comment...',
  autoFocus = false,
  workspaceId,
  disabled = false,
}: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  const fetchWorkspaceMembers = async () => {
    if (!workspaceId) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          profiles (
            id,
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const memberProfiles = (data || [])
        .map((m: any) => m.profiles)
        .filter(Boolean);
      setMembers(memberProfiles);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setContent(value);
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, position);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const search = textBeforeCursor.substring(atIndex + 1);
      if (!search.includes(' ')) {
        setMentionSearch(search.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (member: WorkspaceMember) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = content.substring(cursorPosition);
    
    const displayName = member.display_name || member.email.split('@')[0];
    const mention = `@[${displayName}](${member.id})`;
    
    const newContent = content.substring(0, atIndex) + mention + ' ' + textAfterCursor;
    setContent(newContent);
    setShowMentions(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.display_name?.toLowerCase().includes(mentionSearch) ||
        m.email.toLowerCase().includes(mentionSearch))
  );

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled || isSubmitting}
          className="min-h-[60px] resize-none text-sm"
          rows={2}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting || disabled}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Mentions dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => insertMention(member)}
              className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(member.display_name || member.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.display_name || member.email.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Press ⌘+Enter to send • Type @ to mention
      </p>
    </div>
  );
};
