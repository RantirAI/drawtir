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
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
      <SliderPrimitive.Range className="absolute h-full bg-[#3B82F6] rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative flex items-center justify-center gap-0.5 h-5 w-5 rounded-lg bg-white border border-gray-300 shadow-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 active:scale-105 cursor-grab active:cursor-grabbing">
      <span className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
      <span className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
export default Slider
