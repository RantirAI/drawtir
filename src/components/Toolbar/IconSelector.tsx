import { Smile, Heart, Star, Home, Settings, Mail, Phone, MapPin, Calendar, Clock, User, Search, Bell, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FaHeart, FaUser, FaStar, FaHome, FaShoppingCart, FaCamera, FaCoffee, FaMusic, FaGamepad } from "react-icons/fa";
import { MdEmail, MdPhone, MdSettings, MdNotifications, MdLocationOn } from "react-icons/md";
import { HiHome, HiMenu, HiSearch, HiUser, HiHeart } from "react-icons/hi";
import { AiOutlineStar, AiOutlineHeart, AiOutlineHome, AiOutlineUser, AiOutlineShopping } from "react-icons/ai";

interface IconSelectorProps {
  children: React.ReactNode;
  onIconSelect: (iconName: string, iconFamily: string) => void;
}

export default function IconSelector({ children, onIconSelect }: IconSelectorProps) {
  const lucideIcons = [
    { name: "smile", icon: Smile, label: "Smile" },
    { name: "heart", icon: Heart, label: "Heart" },
    { name: "star", icon: Star, label: "Star" },
    { name: "home", icon: Home, label: "Home" },
    { name: "settings", icon: Settings, label: "Settings" },
    { name: "mail", icon: Mail, label: "Mail" },
    { name: "phone", icon: Phone, label: "Phone" },
    { name: "map-pin", icon: MapPin, label: "Map Pin" },
    { name: "calendar", icon: Calendar, label: "Calendar" },
    { name: "clock", icon: Clock, label: "Clock" },
    { name: "user", icon: User, label: "User" },
    { name: "search", icon: Search, label: "Search" },
    { name: "bell", icon: Bell, label: "Bell" },
    { name: "menu", icon: Menu, label: "Menu" },
    { name: "chevron-right", icon: ChevronRight, label: "Arrow" },
  ];

  const fontAwesomeIcons = [
    { name: "FaHeart", icon: FaHeart, label: "Heart" },
    { name: "FaUser", icon: FaUser, label: "User" },
    { name: "FaStar", icon: FaStar, label: "Star" },
    { name: "FaHome", icon: FaHome, label: "Home" },
    { name: "FaShoppingCart", icon: FaShoppingCart, label: "Cart" },
    { name: "FaCamera", icon: FaCamera, label: "Camera" },
    { name: "FaCoffee", icon: FaCoffee, label: "Coffee" },
    { name: "FaMusic", icon: FaMusic, label: "Music" },
    { name: "FaGamepad", icon: FaGamepad, label: "Game" },
  ];

  const materialIcons = [
    { name: "MdEmail", icon: MdEmail, label: "Email" },
    { name: "MdPhone", icon: MdPhone, label: "Phone" },
    { name: "MdSettings", icon: MdSettings, label: "Settings" },
    { name: "MdNotifications", icon: MdNotifications, label: "Notifications" },
    { name: "MdLocationOn", icon: MdLocationOn, label: "Location" },
  ];

  const heroIcons = [
    { name: "HiHome", icon: HiHome, label: "Home" },
    { name: "HiMenu", icon: HiMenu, label: "Menu" },
    { name: "HiSearch", icon: HiSearch, label: "Search" },
    { name: "HiUser", icon: HiUser, label: "User" },
    { name: "HiHeart", icon: HiHeart, label: "Heart" },
  ];

  const antDesignIcons = [
    { name: "AiOutlineStar", icon: AiOutlineStar, label: "Star" },
    { name: "AiOutlineHeart", icon: AiOutlineHeart, label: "Heart" },
    { name: "AiOutlineHome", icon: AiOutlineHome, label: "Home" },
    { name: "AiOutlineUser", icon: AiOutlineUser, label: "User" },
    { name: "AiOutlineShopping", icon: AiOutlineShopping, label: "Shopping" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="center" 
        className="w-80 p-0 bg-popover/95 backdrop-blur-xl border shadow-lg"
      >
        <Tabs defaultValue="lucide" className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
            <TabsTrigger value="lucide" className="text-xs">Lucide</TabsTrigger>
            <TabsTrigger value="fa" className="text-xs">FA</TabsTrigger>
            <TabsTrigger value="md" className="text-xs">MD</TabsTrigger>
            <TabsTrigger value="hi" className="text-xs">Hero</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">Ant</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-64">
            <TabsContent value="lucide" className="p-2 m-0">
              <div className="grid grid-cols-5 gap-1">
                {lucideIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 p-1"
                    onClick={() => onIconSelect(item.name, "lucide")}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="fa" className="p-2 m-0">
              <div className="grid grid-cols-5 gap-1">
                {fontAwesomeIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 p-1"
                    onClick={() => onIconSelect(item.name, "fa")}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="md" className="p-2 m-0">
              <div className="grid grid-cols-5 gap-1">
                {materialIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 p-1"
                    onClick={() => onIconSelect(item.name, "md")}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="hi" className="p-2 m-0">
              <div className="grid grid-cols-5 gap-1">
                {heroIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 p-1"
                    onClick={() => onIconSelect(item.name, "hi")}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai" className="p-2 m-0">
              <div className="grid grid-cols-5 gap-1">
                {antDesignIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 p-1"
                    onClick={() => onIconSelect(item.name, "ai")}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
