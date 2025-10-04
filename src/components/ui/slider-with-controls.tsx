import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SliderWithControlsProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  className?: string
}

export function SliderWithControls({
  value,
  onValueChange,
  min,
  max,
  step,
  className
}: SliderWithControlsProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value[0] - step)
    onValueChange([newValue])
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value[0] + step)
    onValueChange([newValue])
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 hover:bg-muted"
        onClick={handleDecrement}
        disabled={value[0] <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 hover:bg-muted"
        onClick={handleIncrement}
        disabled={value[0] >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default SliderWithControls
