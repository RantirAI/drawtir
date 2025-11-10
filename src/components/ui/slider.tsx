import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-8 w-full grow overflow-hidden rounded-[5px] bg-gray-200/60">
      <SliderPrimitive.Range className="absolute h-full bg-[#4F8EF7]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative flex items-center justify-center gap-[3px] h-[30px] w-[18px] -ml-[9px] rounded-[3px] bg-white border border-gray-300/50 shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8EF7] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-100 cursor-grab active:cursor-grabbing">
      <span className="w-[2px] h-3.5 bg-gray-400/70 rounded-full" />
      <span className="w-[2px] h-3.5 bg-gray-400/70 rounded-full" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
export default Slider
