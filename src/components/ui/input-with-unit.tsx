import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InputWithUnitProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: number;
  onChange: (value: number) => void;
  unit?: "px" | "rem" | "%" | "em";
  onUnitChange?: (unit: "px" | "rem" | "%" | "em") => void;
  showUnitSelector?: boolean;
  availableUnits?: Array<"px" | "rem" | "%" | "em">;
  className?: string;
}

const InputWithUnit = React.forwardRef<HTMLInputElement, InputWithUnitProps>(
  ({ className, value, onChange, unit = "px", onUnitChange, showUnitSelector = true, availableUnits = ["px", "rem", "%", "em"], ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(String(value));

    React.useEffect(() => {
      setLocalValue(String(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);
      
      const numValue = Number(inputValue);
      if (!isNaN(numValue) && inputValue !== "") {
        onChange(numValue);
      }
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          className={cn(
            "h-7 text-xs pr-14 min-w-[80px]",
            className
          )}
          ref={ref}
          {...props}
        />
        {showUnitSelector ? (
          <Select value={unit} onValueChange={onUnitChange}>
            <SelectTrigger className="absolute right-0 h-7 w-12 border-0 bg-transparent text-[10px] px-1 focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[60px]">
              {availableUnits.includes("px") && <SelectItem value="px" className="text-[10px]">px</SelectItem>}
              {availableUnits.includes("rem") && <SelectItem value="rem" className="text-[10px]">rem</SelectItem>}
              {availableUnits.includes("%") && <SelectItem value="%" className="text-[10px]">%</SelectItem>}
              {availableUnits.includes("em") && <SelectItem value="em" className="text-[10px]">em</SelectItem>}
            </SelectContent>
          </Select>
        ) : (
          <span className="absolute right-2 text-[10px] text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    );
  }
);

InputWithUnit.displayName = "InputWithUnit";

export { InputWithUnit };
