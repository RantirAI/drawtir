import { lazy, Suspense, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as HiIcons from 'react-icons/hi';
import * as AiIcons from 'react-icons/ai';
import * as IconsaxIcons from 'iconsax-react';
import * as FiIcons from 'react-icons/fi';

interface DynamicIconProps {
  iconName?: string;
  iconFamily?: string;
  color?: string;
  size?: number | string;
  className?: string;
}

export default function DynamicIcon({ 
  iconName, 
  iconFamily, 
  color = '#000000',
  size,
  className = ''
}: DynamicIconProps) {
  const IconComponent = useMemo(() => {
    if (!iconName || !iconFamily) return null;

    try {
      if (iconFamily === 'lucide') {
        // Convert kebab-case to PascalCase (e.g., "heart" -> "Heart")
        const pascalName = iconName.split('-').map((w: string) => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join('');
        return (LucideIcons as any)[pascalName];
      } else if (iconFamily === 'iconsax') {
        return (IconsaxIcons as any)[iconName];
      } else if (iconFamily === 'fa' || iconFamily === 'fontawesome') {
        return (FaIcons as any)[iconName];
      } else if (iconFamily === 'md' || iconFamily === 'material') {
        return (MdIcons as any)[iconName];
      } else if (iconFamily === 'hi') {
        return (HiIcons as any)[iconName];
      } else if (iconFamily === 'ai') {
        return (AiIcons as any)[iconName];
      } else if (iconFamily === 'fi' || iconFamily === 'feather') {
        return (FiIcons as any)[iconName];
      }
    } catch (error) {
      console.error('Error loading icon:', error);
    }
    return null;
  }, [iconName, iconFamily]);

  if (!IconComponent) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ color }}
      >
        <LucideIcons.HelpCircle style={{ width: size || '100%', height: size || '100%' }} />
      </div>
    );
  }

  return (
    <IconComponent 
      className={className}
      style={{ 
        width: size || '100%', 
        height: size || '100%', 
        color 
      }} 
    />
  );
}
