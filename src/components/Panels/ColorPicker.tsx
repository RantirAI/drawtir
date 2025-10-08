import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  showOpacity?: boolean;
}

export default function ColorPicker({
  color,
  onChange,
  opacity = 100,
  onOpacityChange,
  showOpacity = true,
}: ColorPickerProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert hex to HSL
  useEffect(() => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    setHue(Math.round(h * 360));
    setSaturation(Math.round(s * 100));
    setLightness(Math.round(l * 100));
  }, [color]);

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handlePickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setSaturation(Math.round(x * 100));
    setLightness(Math.round((1 - y) * 100));
    onChange(hslToHex(hue, Math.round(x * 100), Math.round((1 - y) * 100)));
  };

  const handlePickerMouseMove = (e: MouseEvent) => {
    if (!isDragging || !pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setSaturation(Math.round(x * 100));
    setLightness(Math.round((1 - y) * 100));
    onChange(hslToHex(hue, Math.round(x * 100), Math.round((1 - y) * 100)));
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handlePickerMouseMove);
      document.addEventListener("mouseup", () => setIsDragging(false));
      return () => {
        document.removeEventListener("mousemove", handlePickerMouseMove);
        document.removeEventListener("mouseup", () => setIsDragging(false));
      };
    }
  }, [isDragging]);

  return (
    <div className="space-y-2">
      {/* 2D Color Picker */}
      <div
        ref={pickerRef}
        className="relative w-full h-32 rounded cursor-crosshair overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, 
            hsl(${hue}, 100%, 100%) 0%, 
            hsl(${hue}, 100%, 50%) 50%, 
            hsl(${hue}, 100%, 0%) 100%
          )`,
        }}
        onClick={handlePickerClick}
        onMouseDown={() => setIsDragging(true)}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              hsl(${hue}, 0%, ${lightness}%), 
              hsl(${hue}, 100%, ${lightness}%)
            )`,
          }}
        />
        
        {/* Selector */}
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        className="relative w-full h-3 rounded cursor-pointer"
        style={{
          background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const newHue = Math.round(x * 360);
          setHue(newHue);
          onChange(hslToHex(newHue, saturation, lightness));
        }}
      >
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: `${(hue / 360) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Opacity Slider */}
      {showOpacity && onOpacityChange && (
        <div 
          className="relative w-full h-3 rounded cursor-pointer overflow-hidden"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #ccc 25%, transparent 25%), 
              linear-gradient(-45deg, #ccc 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #ccc 75%), 
              linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const newOpacity = Math.round(x * 100);
            onOpacityChange(newOpacity);
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, transparent, ${color})`
            }}
          />
          <div
            className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none bg-background"
            style={{
              left: `${opacity}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}

      {/* Hex and Opacity Input Row */}
      <div className="flex items-center gap-1.5 pt-1">
        <Pipette className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="text"
          value={color.toUpperCase()}
          onChange={(e) => {
            const value = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
              onChange(value);
            }
          }}
          placeholder="#000000"
          className="h-7 text-xs font-mono w-20"
        />
        {showOpacity && onOpacityChange && (
          <div className="flex items-center gap-1 flex-1">
            <Input
              type="number"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              min={0}
              max={100}
              className="h-7 text-xs w-14 text-right"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}
      </div>
    </div>
  );
}
