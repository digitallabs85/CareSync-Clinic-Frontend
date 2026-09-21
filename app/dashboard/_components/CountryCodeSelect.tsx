// app/_components/CountryCodeSelect.tsx
'use client'
import React, { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { CountryDialInfo } from '@/app/_utils/whatsapp'

interface CountryCodeSelectProps {
  value: CountryDialInfo
  options: CountryDialInfo[]
  onChange: (country: CountryDialInfo) => void
  accentClassName?: string // border/focus color, defaults to WhatsApp green
}

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value,
  options,
  onChange,
  accentClassName = 'border-[#25D366]',
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-24 shrink-0 h-9 px-2 justify-between text-xs font-bold bg-white border-2 rounded-xl',
            accentClassName
          )}
        >
          <span className="truncate">
            {value.iso === 'XX' ? 'Other' : `${value.iso} +${value.dial}`}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {options.map((c) => (
                <CommandItem
                  key={c.iso}
                  value={`${c.name} ${c.iso} ${c.dial}`}
                  onSelect={() => {
                    onChange(c)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value.iso === c.iso ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{c.iso === 'XX' ? 'Other' : c.name}</span>
                  <span className="text-slate-400 ml-2 shrink-0">+{c.dial}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}