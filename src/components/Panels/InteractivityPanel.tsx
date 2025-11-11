import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Info, Sparkles } from "lucide-react";
import type { Element } from "@/types/elements";

interface InteractivityPanelProps {
  selectedElements: Element[];
  onUpdate: (id: string, updates: Partial<Element>) => void;
}

export const InteractivityPanel = ({ selectedElements, onUpdate }: InteractivityPanelProps) => {
  if (selectedElements.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select an element to add interactivity
      </div>
    );
  }

  const element = selectedElements[0];
  const interactivity = element.interactivity || {
    enabled: false,
    actionType: "link" as const,
  };

  const handleToggle = (enabled: boolean) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        enabled,
      },
    });
  };

  const handleActionTypeChange = (actionType: "link" | "info" | "animation") => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        actionType,
      },
    });
  };

  const handleUrlChange = (url: string) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        url,
      },
    });
  };

  const handleOpenInNewTabChange = (openInNewTab: boolean) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        openInNewTab,
      },
    });
  };

  const handleInfoTitleChange = (infoTitle: string) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        infoTitle,
      },
    });
  };

  const handleInfoContentChange = (infoContent: string) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        infoContent,
      },
    });
  };

  const handleTriggerAnimationsChange = (triggerAnimations: boolean) => {
    onUpdate(element.id, {
      interactivity: {
        ...interactivity,
        triggerAnimations,
      },
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="interactivity-enabled" className="text-sm font-medium">
          Enable Interactivity
        </Label>
        <Switch
          id="interactivity-enabled"
          checked={interactivity.enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {interactivity.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Action Type</Label>
            <Select value={interactivity.actionType} onValueChange={handleActionTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </div>
                </SelectItem>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Show Information
                  </div>
                </SelectItem>
                <SelectItem value="animation">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Trigger Animation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {interactivity.actionType === "link" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={interactivity.url || ""}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-tab" className="text-sm">
                  Open in New Tab
                </Label>
                <Switch
                  id="new-tab"
                  checked={interactivity.openInNewTab || false}
                  onCheckedChange={handleOpenInNewTabChange}
                />
              </div>
            </div>
          )}

          {interactivity.actionType === "info" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="info-title" className="text-sm">Title</Label>
                <Input
                  id="info-title"
                  placeholder="Information Title"
                  value={interactivity.infoTitle || ""}
                  onChange={(e) => handleInfoTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="info-content" className="text-sm">Content</Label>
                <Textarea
                  id="info-content"
                  placeholder="Enter the information to display..."
                  value={interactivity.infoContent || ""}
                  onChange={(e) => handleInfoContentChange(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}

          {interactivity.actionType === "animation" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="trigger-animations" className="text-sm">
                  Trigger Element Animations
                </Label>
                <Switch
                  id="trigger-animations"
                  checked={interactivity.triggerAnimations || false}
                  onCheckedChange={handleTriggerAnimationsChange}
                />
              </div>
              {element.animations && element.animations.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Will play {element.animations.length} animation(s) when clicked
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add animations to this element in the Animations panel first
                </p>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {interactivity.actionType === "link" && "Element will open the URL when clicked"}
              {interactivity.actionType === "info" && "Element will show a popup with information when clicked"}
              {interactivity.actionType === "animation" && "Element will play its animations when clicked"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
