import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Palette, Type, Image as ImageIcon, Trash2, Check, Copy, Upload, X } from "lucide-react";
import DraggablePanel from "./DraggablePanel";
import { useBrandKit } from "@/hooks/useBrandKit";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BrandKitPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyColor?: (color: string) => void;
  onApplyFont?: (font: string) => void;
}

const COMMON_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway",
  "Poppins", "Oswald", "Merriweather", "Ubuntu", "Playfair Display",
  "Source Sans Pro", "Nunito", "PT Sans", "Work Sans", "Archivo",
  "Bebas Neue", "Crimson Text", "DM Sans", "IBM Plex Sans"
];

export default function BrandKitPanel({ isOpen, onClose, onApplyColor, onApplyFont }: BrandKitPanelProps) {
  const { brandKits, activeBrandKit, setActiveBrandKit, saveBrandKit, deleteBrandKit, updateBrandKit } = useBrandKit();
  const [isCreating, setIsCreating] = useState(false);
  const [newKitName, setNewKitName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newFont, setNewFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");

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
    if (!activeBrandKit || !newFont) {
      toast.error("Please select a font");
      return;
    }

    if (activeBrandKit.fonts.includes(newFont)) {
      toast.error("Font already added");
      return;
    }

    const updatedFonts = [...activeBrandKit.fonts, newFont];
    await updateBrandKit(activeBrandKit.id, { fonts: updatedFonts });
    setNewFont("Inter");
  };

  const handleRemoveFont = async (font: string) => {
    if (!activeBrandKit) return;

    const updatedFonts = activeBrandKit.fonts.filter(f => f !== font);
    await updateBrandKit(activeBrandKit.id, { fonts: updatedFonts });
  };

  const handleAddLogo = async () => {
    if (!activeBrandKit || !logoUrl.trim()) {
      toast.error("Please enter a logo URL");
      return;
    }

    const updatedLogos = [...activeBrandKit.logo_urls, logoUrl];
    await updateBrandKit(activeBrandKit.id, { logo_urls: updatedLogos });
    setLogoUrl("");
  };

  const handleRemoveLogo = async (url: string) => {
    if (!activeBrandKit) return;

    const updatedLogos = activeBrandKit.logo_urls.filter(l => l !== url);
    await updateBrandKit(activeBrandKit.id, { logo_urls: updatedLogos });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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
              {brandKits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No brand kits yet</p>
                  <p className="text-xs mt-1">Create one to get started</p>
                </div>
              ) : (
                brandKits.map((kit) => (
                  <div
                    key={kit.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      activeBrandKit?.id === kit.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setActiveBrandKit(kit)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{kit.name}</span>
                        {kit.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{kit.colors.length} colors</span>
                        <span>{kit.fonts.length} fonts</span>
                        <span>{kit.logo_urls.length} logos</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBrandKit(kit.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {activeBrandKit && (
            <>
              <Separator />

              {/* Colors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <Label className="text-sm font-medium">Brand Colors</Label>
                  </div>
                  <Badge variant="outline">{activeBrandKit.colors.length}</Badge>
                </div>

                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-12 h-10 p-0"
                        style={{ backgroundColor: newColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-3">
                        <Label>Pick a color</Label>
                        <Input
                          type="color"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="w-full h-32"
                        />
                        <Input
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" onClick={handleAddColor} className="flex-1">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Color
                  </Button>
                </div>

                {activeBrandKit.colors.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    <Palette className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>No colors yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {activeBrandKit.colors.map((color, index) => (
                      <Popover key={index}>
                        <PopoverTrigger asChild>
                          <div className="relative group cursor-pointer">
                            <div
                              className="w-full aspect-square rounded-lg border-2 border-border hover:border-primary hover:scale-105 transition-all shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs font-mono text-center truncate">{color}</p>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b">
                              <Label className="text-xs font-medium">Color</Label>
                              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{color}</code>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8"
                                onClick={() => copyToClipboard(color)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full h-8"
                                onClick={() => onApplyColor?.(color)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Apply
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full h-8"
                              onClick={() => handleRemoveColor(color)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Fonts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <Label className="text-sm font-medium">Brand Fonts</Label>
                  </div>
                  <Badge variant="outline">{activeBrandKit.fonts.length}</Badge>
                </div>

                <div className="flex gap-2">
                  <Select value={newFont} onValueChange={setNewFont}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_FONTS.map((font) => (
                        <SelectItem 
                          key={font} 
                          value={font}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddFont}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {activeBrandKit.fonts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    <Type className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>No fonts yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeBrandKit.fonts.map((font, index) => (
                      <div
                        key={index}
                        className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">{font}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => onApplyFont?.(font)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 hover:text-destructive"
                              onClick={() => handleRemoveFont(font)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <button
                          className="w-full text-left text-lg cursor-pointer hover:text-primary transition-colors"
                          style={{ fontFamily: font }}
                          onClick={() => onApplyFont?.(font)}
                        >
                          The quick brown fox jumps
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Logos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <Label className="text-sm font-medium">Brand Logos</Label>
                  </div>
                  <Badge variant="outline">{activeBrandKit.logo_urls.length}</Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Logo URL"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLogo()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddLogo}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {activeBrandKit.logo_urls.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                    <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>No logos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activeBrandKit.logo_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border bg-card overflow-hidden">
                          <img
                            src={url}
                            alt="Brand logo"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          onClick={() => handleRemoveLogo(url)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </DraggablePanel>
  );
}
