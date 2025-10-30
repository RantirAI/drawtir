import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue.trim() && tempValue !== value) {
      onChange(tempValue);
    } else {
      setTempValue(value);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs font-semibold bg-transparent border-0 px-2 py-0 w-auto min-w-[100px]"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-100"
          onClick={handleSave}
          title="Save (Enter)"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-red-600 hover:text-red-700 hover:bg-red-100"
          onClick={handleCancel}
          title="Cancel (Esc)"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
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
