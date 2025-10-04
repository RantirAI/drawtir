import { useState } from "react";

interface PosterPreviewProps {
  image: string | null;
  topCaption?: string;
  bottomCaption?: string;
  backgroundColor?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  textSize?: number;
  textOpacity?: number;
  imageStyle?: string;
  filterStyle?: any;
  linkText?: string;
  linkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  gradientIntensity?: number;
}

export default function PosterPreview({
  image,
  topCaption = "",
  bottomCaption = "",
  backgroundColor = "#000000",
  textColor = "#ffffff",
  textAlign = "center",
  textSize = 3,
  textOpacity = 100,
  imageStyle = "cover",
  filterStyle = {},
  linkText = "",
  linkPosition = "top-right",
  gradientIntensity = 80,
}: PosterPreviewProps) {
  const getTextSizeClass = () => {
    const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"];
    return sizes[textSize - 1] || "text-2xl";
  };

  const getLinkPositionClass = () => {
    const positions = {
      "top-left": "top-6 left-6",
      "top-right": "top-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "bottom-right": "bottom-6 right-6"
    };
    return positions[linkPosition];
  };

  return (
    <div 
      className="w-full h-full rounded-lg overflow-hidden shadow-2xl relative"
      style={{ backgroundColor }}
    >
      {image && (
        <img
          src={image}
          alt="Poster"
          className="w-full h-full"
          style={{
            ...filterStyle,
          }}
        />
      )}

      {/* Top Caption */}
      {topCaption && (
        <div 
          className={`absolute top-0 left-0 right-0 p-8 flex ${textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'}`}
          style={{ opacity: textOpacity / 100 }}
        >
          <div className={`${getTextSizeClass()} font-bold drop-shadow-2xl`} style={{ color: textColor }}>
            {topCaption.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Caption with Gradient */}
      {bottomCaption && (
        <>
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${gradientIntensity / 200}) 40%, rgba(0,0,0,${gradientIntensity / 100}) 100%)`
            }}
          />
          <div 
            className={`absolute bottom-0 left-0 right-0 p-8 flex ${textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'}`}
            style={{ opacity: textOpacity / 100 }}
          >
            <div className={`${getTextSizeClass()} font-bold drop-shadow-2xl`} style={{ color: textColor }}>
              {bottomCaption.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Link Badge */}
      {linkText && (
        <div className={`absolute ${getLinkPositionClass()}`}>
          <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold">
            {linkText}
          </div>
        </div>
      )}
    </div>
  );
}
