import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Palette, Type, Image as ImageIcon, Trash2, Check } from "lucide-react";
import DraggablePanel from "./DraggablePanel";
import { useBrandKit } from "@/hooks/useBrandKit";
import { toast } from "sonner";

interface BrandKitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyColor?: (color: string) => void;
  onApplyFont?: (font: string) => void;
}

export default function BrandKitPanel({ isOpen, onClose, onApplyColor, onApplyFont }: BrandKitPanelProps) {
  const { brandKits, activeBrandKit, setActiveBrandKit, saveBrandKit, deleteBrandKit, updateBrandKit } = useBrandKit();
  const [isCreating, setIsCreating] = useState(false);
  const [newKitName, setNewKitName] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [newFont, setNewFont] = useState("");

  const handleCreateKit = async () => {
    if (!newKitName.trim()) {
      toast.error("Please enter a brand kit name");
      return;
    }

    await saveBrandKit({
      name: newKitName,
      colors: [],
      fonts: [],
      logo_urls: [],
    });

    setNewKitName("");
    setIsCreating(false);
  };

  const handleAddColor = async () => {
    if (!activeBrandKit) {
      toast.error("Please select a brand kit first");
      return;
    }

    const updatedColors = [...activeBrandKit.colors, newColor];
    await updateBrandKit(activeBrandKit.id, { colors: updatedColors });
  };

  const handleRemoveColor = async (color: string) => {
    if (!activeBrandKit) return;

    const updatedColors = activeBrandKit.colors.filter(c => c !== color);
    await updateBrandKit(activeBrandKit.id, { colors: updatedColors });
  };

  const handleAddFont = async () => {
    if (!activeBrandKit || !newFont.trim()) {
      toast.error("Please enter a font name");
      return;
    }

    const updatedFonts = [...activeBrandKit.fonts, newFont];
    await updateBrandKit(activeBrandKit.id, { fonts: updatedFonts });
    setNewFont("");
  };

  const handleRemoveFont = async (font: string) => {
    if (!activeBrandKit) return;

    const updatedFonts = activeBrandKit.fonts.filter(f => f !== font);
    await updateBrandKit(activeBrandKit.id, { fonts: updatedFonts });
  };

  if (!isOpen) return null;

  return (
    <DraggablePanel
      title="Brand Kit"
      onClose={onClose}
      defaultPosition={{ x: 120, y: 150 }}
    >
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {/* Brand Kit Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Brand Kits</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(!isCreating)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Kit
              </Button>
            </div>

            {isCreating && (
              <div className="flex gap-2">
                <Input
                  placeholder="Brand kit name"
                  value={newKitName}
                  onChange={(e) => setNewKitName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleCreateKit}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="grid gap-2">
              {brandKits.map((kit) => (
                <Button
                  key={kit.id}
                  variant={activeBrandKit?.id === kit.id ? "default" : "outline"}
                  className="justify-between"
                  onClick={() => setActiveBrandKit(kit)}
                >
                  <span>{kit.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBrandKit(kit.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Button>
              ))}
            </div>
          </div>

          {activeBrandKit && (
            <>
              <Separator />

              {/* Colors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <Label className="text-sm font-medium">Brand Colors</Label>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Button size="sm" onClick={handleAddColor} className="flex-1">
                    Add Color
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {activeBrandKit.colors.map((color, index) => (
                    <div key={index} className="relative group">
                      <button
                        className="w-full aspect-square rounded-md border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => onApplyColor?.(color)}
                        title={`Apply ${color}`}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveColor(color)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Fonts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <Label className="text-sm font-medium">Brand Fonts</Label>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Font name (e.g., Inter, Roboto)"
                    value={newFont}
                    onChange={(e) => setNewFont(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddFont}>
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {activeBrandKit.fonts.map((font, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <button
                        className="flex-1 text-left text-sm"
                        style={{ fontFamily: font }}
                        onClick={() => onApplyFont?.(font)}
                      >
                        {font}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleRemoveFont(font)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </DraggablePanel>
  );
}
