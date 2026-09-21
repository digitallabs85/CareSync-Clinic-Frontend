"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// We Omit the default 'onChange' so we can redefine it as a string-only function
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options?: string[]
  placeholder?: string
  required?: boolean
  error?: string
  onChange?: (value: string) => void 
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, required, className, error, onChange, ...props }, ref) => {
    
    // Internal handler to bridge the HTML event and your updateForm function
    const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative group">
          <select
            ref={ref}
            required={required}
            onChange={handleValueChange}
            className={cn(
              "appearance-none w-full h-14 px-5 pr-12 bg-slate-50 border-2 border-transparent",
              "focus:border-[#0297d6] focus:bg-white focus:ring-4 focus:ring-[#0297d6]/10",
              "rounded-2xl outline-none text-slate-800 font-medium cursor-pointer transition-all",
              error && "border-red-500 bg-red-50/10",
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder || "Select option"}
            </option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          
          <ChevronDown 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0297d6] pointer-events-none transition-colors" 
          />
        </div>
        
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = "Select"

export { Select }