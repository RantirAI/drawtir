import { QRCodeSVG } from 'qrcode.react';
import type { Element } from "@/types/elements";

interface QRCodeElementProps {
  element: Element;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function QRCodeElement({ element, isSelected, onClick }: QRCodeElementProps) {
  const transform = `translate(${element.x}px, ${element.y}px) rotate(${element.rotation || 0}deg)`;

  return (
    <div
      style={{
        position: 'absolute',
        transform,
        width: element.width,
        height: element.height,
        opacity: element.opacity || 1,
        pointerEvents: element.isLocked ? 'none' : 'auto',
        cursor: element.isLocked ? 'not-allowed' : 'move',
        outline: isSelected ? '2px solid hsl(var(--primary))' : 'none',
        outlineOffset: '2px',
      }}
      onClick={onClick}
      className="qr-code-element"
    >
      <QRCodeSVG
        value={element.qrValue || "https://example.com"}
        size={Math.min(element.width, element.height)}
        bgColor={element.qrBgColor || "#ffffff"}
        fgColor={element.qrFgColor || "#000000"}
        level={element.qrLevel || "M"}
        includeMargin={false}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
