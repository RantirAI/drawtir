import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GripVertical, Pencil } from "lucide-react";

interface FrameBadgeProps {
  name: string;
  x: number;
  y: number;
  onChange: (name: string) => void;
}

export default function FrameBadge({ name, x, y, onChange }: FrameBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempName(name);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempName(name);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      onChange(tempName);
    } else {
      setTempName(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempName(name);
    }
  };

  if (isEditing) {
    return (
      <div
        className="absolute z-50"
        style={{ left: x, top: y - 28 }}
      >
        <Input
          ref={inputRef}
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 text-[10px] font-medium bg-card/90 backdrop-blur-sm border px-2 py-0 w-24"
        />
      </div>
    );
  }

  return (
    <div
      className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border text-[10px] font-medium hover:bg-card/90 transition-colors group"
      style={{ left: x, top: y - 28 }}
      onDoubleClick={handleDoubleClick}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
      <span className="cursor-text">{name}</span>
      <button
        onClick={handleEditClick}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
        aria-label="Edit frame name"
      >
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}
