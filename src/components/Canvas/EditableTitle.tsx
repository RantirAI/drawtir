import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EditableTitle({ value, onChange }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue.trim()) {
      onChange(tempValue);
    } else {
      setTempValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-6 text-xs font-semibold bg-transparent border-0 px-2 py-0 w-auto min-w-[100px]"
      />
    );
  }

  return (
    <span
      className="text-xs font-semibold px-2 cursor-text hover:bg-accent/50 rounded transition-colors"
      onDoubleClick={handleDoubleClick}
    >
      {value}
    </span>
  );
}
