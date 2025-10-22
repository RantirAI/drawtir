import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Heading1, Heading2, Heading3, Type, List, ListOrdered, 
  Quote, Code, Link, Bold, Italic, Strikethrough, Trash2
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
          <ul style={{ ...baseStyle, fontSize, paddingLeft: "20px" }}>
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
          <ol style={{ ...baseStyle, fontSize, paddingLeft: "20px" }}>
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
    <div className="w-full h-full p-2 overflow-auto">
      {blocks.map((block) => (
        <div key={block.id} className="relative group">
          {getBlockElement(block)}
          {isEditing && selectedBlockId === block.id && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -right-2 -top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      
      {isEditing && (
        <TooltipProvider>
          <div className="flex flex-wrap gap-1 mt-4 p-2 border-t border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("h1")}>
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add H1</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("h2")}>
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add H2</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("h3")}>
                  <Heading3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add H3</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("p")}>
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Paragraph</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("ul")}>
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Bullet List</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("ol")}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Numbered List</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("blockquote")}>
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Quote</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddBlock("code")}>
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Code Block</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
