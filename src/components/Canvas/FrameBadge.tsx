import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
      className="absolute z-10 px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border text-[10px] font-medium cursor-text hover:bg-card/90 transition-colors"
      style={{ left: x, top: y - 28 }}
      onDoubleClick={handleDoubleClick}
    >
      {name}
    </div>
  );
}
