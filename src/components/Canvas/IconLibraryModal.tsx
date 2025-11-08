import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, icons as LucideIconMap } from "lucide-react";
import * as IconsaxIcons from "iconsax-react";
import * as ReactIcons from "react-icons/fa";
import * as MaterialIcons from "react-icons/md";
import * as FeatherIcons from "react-icons/fi";

interface IconLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (iconName: string, library: string) => void;
}

// Filter out non-icon exports from lucide-react
const lucideIconNames = Object.keys(LucideIconMap);

// Get iconsax icon names
const iconsaxIconNames = Object.keys(IconsaxIcons).filter(
  (key) => typeof (IconsaxIcons as any)[key] === "function"
);

// Get react-icons names (Font Awesome)
const reactIconNames = Object.keys(ReactIcons);

// Get material icons
const materialIconNames = Object.keys(MaterialIcons);

// Get feather icons
const featherIconNames = Object.keys(FeatherIcons);

export default function IconLibraryModal({
  open,
  onOpenChange,
  onSelectIcon,
}: IconLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("lucide");

  const filterIcons = (icons: string[]) => {
    if (!searchQuery) return icons.slice(0, 200); // Limit to 200 for performance
    return icons.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 100);
  };

  const renderIconGrid = (
    iconNames: string[],
    library: string,
    IconComponent: any
  ) => {
    const filtered = filterIcons(iconNames);

    return (
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-4">
        {filtered.map((iconName) => {
          const Icon = IconComponent[iconName];
          if (!Icon) return null;

          return (
            <button
              key={iconName}
              onClick={() => {
                onSelectIcon(iconName, library);
                onOpenChange(false);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all group"
              title={iconName}
            >
              <Icon size={24} className="mb-1 text-foreground" />
              <span className="text-[8px] text-muted-foreground truncate w-full text-center group-hover:text-primary">
                {iconName.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Icon Library</DialogTitle>
            <DialogDescription className="sr-only" id="icon-library-desc">
              Browse and search icon libraries.
            </DialogDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyDownCapture={(e) => e.stopPropagation()}
                className="pl-9"
              />
            </div>
          </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-2 w-fit bg-muted/50">
            <TabsTrigger
              value="lucide"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Lucide
            </TabsTrigger>
            <TabsTrigger
              value="iconsax"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Iconsax
            </TabsTrigger>
            <TabsTrigger
              value="fontawesome"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Font Awesome
            </TabsTrigger>
            <TabsTrigger
              value="material"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Material
            </TabsTrigger>
            <TabsTrigger
              value="feather"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Feather
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="lucide" className="m-0">
              {renderIconGrid(lucideIconNames, "lucide", LucideIconMap)}
            </TabsContent>

            <TabsContent value="iconsax" className="m-0">
              {renderIconGrid(iconsaxIconNames, "iconsax", IconsaxIcons)}
            </TabsContent>

            <TabsContent value="fontawesome" className="m-0">
              {renderIconGrid(reactIconNames, "fontawesome", ReactIcons)}
            </TabsContent>

            <TabsContent value="material" className="m-0">
              {renderIconGrid(materialIconNames, "material", MaterialIcons)}
            </TabsContent>

            <TabsContent value="feather" className="m-0">
              {renderIconGrid(featherIconNames, "feather", FeatherIcons)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
