import { cn } from '@sctv/ui'
import { Button } from '@sctv/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@sctv/ui/dropdown-menu'

export interface Option {
  display: string
  value: string
}

interface UnitSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
}

export const UnitSelect = ({ value, onChange, options, className }: UnitSelectProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn('h-8 px-2 text-xs font-light', className)} variant="ghost">
          {options.find((option) => option.value === value)?.display}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={3} alignOffset={2} align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.display}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
