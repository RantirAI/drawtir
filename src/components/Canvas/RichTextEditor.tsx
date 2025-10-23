import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Heading1, Heading2, Heading3, Type, List, ListOrdered, 
  Quote, Code, Link, Bold, Italic, Strikethrough, Trash2, Plus
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextBlock {
  id: string;
  type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "ul" | "ol" | "blockquote" | "code";
  content: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    link?: string;
  };
}

interface RichTextEditorProps {
  blocks: RichTextBlock[];
  isEditing: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  onUpdate: (blocks: RichTextBlock[]) => void;
  onAddBlock: (type: RichTextBlock["type"]) => void;
  onDeleteBlock: (id: string) => void;
}

export default function RichTextEditor({
  blocks,
  isEditing,
  fontSize = 16,
  fontFamily = "Inter",
  fontWeight = "400",
  textAlign = "left",
  color = "#000000",
  onUpdate,
  onAddBlock,
  onDeleteBlock
}: RichTextEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

  const findBlockIndex = (id: string) => blocks.findIndex((b) => b.id === id);

  const focusBlock = (id: string) => {
    const el = blockRefs.current[id];
    if (el) {
      // focus and move caret to end
      el.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const addBlockAfter = (afterId: string, type: RichTextBlock["type"] = "p") => {
    const idx = findBlockIndex(afterId);
    if (idx === -1) return;
    const newBlock: RichTextBlock = {
      id: crypto.randomUUID(),
      type,
      content: "",
      styles: {},
    };
    const updated = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    onUpdate(updated);
    setSelectedBlockId(newBlock.id);
    // focus next tick so DOM updates
    setTimeout(() => focusBlock(newBlock.id), 0);
  };

  const updateBlockStyles = (id: string, styles: Partial<NonNullable<RichTextBlock["styles"]>>) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, styles: { ...b.styles, ...styles } } : b));
    onUpdate(updated);
  };

  const toggleInlineStyle = (id: string, key: 'bold' | 'italic' | 'strikethrough') => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    updateBlockStyles(id, { [key]: !block.styles?.[key] } as any);
  };

  const changeBlockType = (id: string, type: RichTextBlock["type"]) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, type } : b));
    onUpdate(updated);
  };

  const positionToolbar = (id: string) => {
    const container = containerRef.current;
    const el = blockRefs.current[id];
    if (!container || !el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const top = eRect.top - cRect.top + container.scrollTop - 40; // 40px above
    const left = eRect.left - cRect.left + 8; // slight inset
    setToolbarPos({ top: Math.max(0, top), left: Math.max(0, left) });
  };

  useEffect(() => {
    if (selectedBlockId) positionToolbar(selectedBlockId);
  }, [selectedBlockId, blocks]);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(e.target as Node)) {
        setSelectedBlockId(null);
        setToolbarPos(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  const getBlockElement = (block: RichTextBlock) => {
    const baseStyle = {
      fontFamily,
      fontWeight,
      textAlign,
      color,
      margin: 0,
      padding: "4px",
      minHeight: "24px",
      outline: isEditing && selectedBlockId === block.id ? "2px solid #3b82f6" : "none",
      width: "100%",
      maxWidth: "100%",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word" as const,
      boxSizing: "border-box" as const,
    };

    const getContentStyle = () => ({
      fontWeight: block.styles?.bold ? "bold" : fontWeight,
      fontStyle: block.styles?.italic ? "italic" : "normal",
      textDecoration: block.styles?.strikethrough ? "line-through" : "none",
    });

    const handleBlockClick = (e: React.MouseEvent) => {
      if (isEditing) {
        e.stopPropagation();
        setSelectedBlockId(block.id);
      }
    };

    const handleContentChange = (e: React.FormEvent<HTMLElement>) => {
      const newContent = e.currentTarget.textContent || "";
      const updatedBlocks = blocks.map(b => 
        b.id === block.id ? { ...b, content: newContent } : b
      );
      onUpdate(updatedBlocks);
    };

    const content = (
      <span style={getContentStyle()}>
        {block.content || "Type something..."}
      </span>
    );

    switch (block.type) {
      case "h1":
        return (
          <h1 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize * 2 }}
          >
            {content}
          </h1>
        );
      case "h2":
        return (
          <h2 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize * 1.5 }}
          >
            {content}
          </h2>
        );
      case "h3":
        return (
          <h3 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize * 1.25 }}
          >
            {content}
          </h3>
        );
      case "h4":
        return (
          <h4 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize * 1.1 }}
          >
            {content}
          </h4>
        );
      case "h5":
        return (
          <h5 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize }}
          >
            {content}
          </h5>
        );
      case "h6":
        return (
          <h6 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize: fontSize * 0.875 }}
          >
            {content}
          </h6>
        );
      case "p":
        return (
          <p 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize }}
          >
            {content}
          </p>
        );
      case "ul":
        return (
          <ul style={{ ...baseStyle, fontSize, paddingLeft: "20px", listStyleType: "disc", listStylePosition: "inside" }}>
            <li 
              contentEditable={isEditing}
              suppressContentEditableWarning
              onInput={handleContentChange}
              onClick={handleBlockClick}
            >
              {content}
            </li>
          </ul>
        );
      case "ol":
        return (
          <ol style={{ ...baseStyle, fontSize, paddingLeft: "20px", listStyleType: "decimal", listStylePosition: "inside" }}>
            <li 
              contentEditable={isEditing}
              suppressContentEditableWarning
              onInput={handleContentChange}
              onClick={handleBlockClick}
            >
              {content}
            </li>
          </ol>
        );
      case "blockquote":
        return (
          <blockquote 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ 
              ...baseStyle, 
              fontSize, 
              borderLeft: "4px solid #cbd5e1",
              paddingLeft: "16px",
              fontStyle: "italic"
            }}
          >
            {content}
          </blockquote>
        );
      case "code":
        return (
          <pre 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ 
              ...baseStyle, 
              fontSize: fontSize * 0.875,
              fontFamily: "monospace",
              background: "#f1f5f9",
              padding: "8px",
              borderRadius: "4px",
              overflow: "auto"
            }}
          >
            <code>{content}</code>
          </pre>
        );
      default:
        return (
          <p 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleBlockClick}
            style={{ ...baseStyle, fontSize }}
          >
            {content}
          </p>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full p-2 overflow-auto"
      onClick={() => {
        setSelectedBlockId(null);
        setToolbarPos(null);
      }}
      onKeyDownCapture={(e) => {
        if (!isEditing) return;
        if (selectedBlockId && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          addBlockAfter(selectedBlockId, "p");
        }
      }}
    >
      {blocks.map((block) => (
        <div
          key={block.id}
          className="relative group"
          ref={(el) => {
            blockRefs.current[block.id] = el as HTMLElement | null;
          }}
          data-block-id={block.id}
        >
          {getBlockElement(block)}
          {isEditing && selectedBlockId === block.id && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute -left-2 -top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  addBlockAfter(block.id, "p");
                }}
                aria-label="Add block below"
                title="Add block below"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="absolute -right-2 -top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
                aria-label="Delete block"
                title="Delete block"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      ))}
      
      {isEditing && selectedBlockId && toolbarPos && (
        <div
          className="absolute z-20 rounded-md border border-border bg-popover text-popover-foreground shadow-md flex items-center gap-1 p-1"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toggleInlineStyle(selectedBlockId, 'bold')} aria-label="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toggleInlineStyle(selectedBlockId, 'italic')} aria-label="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toggleInlineStyle(selectedBlockId, 'strikethrough')} aria-label="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h1')}>H1</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h2')}>H2</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h3')}>H3</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h4')}>H4</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h5')}>H5</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'h6')}>H6</Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'blockquote')} aria-label="Quote">
            <Quote className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'ul')} aria-label="Bulleted list">
            <List className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'ol')} aria-label="Numbered list">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => changeBlockType(selectedBlockId, 'code')} aria-label="Code block">
            <Code className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
