
import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "../../lib/utils"

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSelected?: boolean;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, isSelected, ...props }, ref) => {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative flex items-center justify-center transition-all",
          isSelected && "bg-primary border-primary",
          className
        )}
        ref={ref}
        {...props}
      >
        {isSelected && (
          <Circle className="h-2 w-2 fill-white text-white absolute" strokeWidth={0} />
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
