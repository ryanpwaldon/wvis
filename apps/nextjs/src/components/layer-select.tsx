import { cn } from '@acme/ui'
import { Button } from '@acme/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@acme/ui/dropdown-menu'

export interface LayerOption {
  id: string
  title: string
}

interface LayerSelectProps {
  value: string
  onChange: (value: string) => void
  options: LayerOption[]
  className?: string
}

export const LayerSelect = ({ value, onChange, options, className }: LayerSelectProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn('h-8 border-r px-2 text-xs font-light', className)} variant="ghost">
          {options.find((option) => option.id === value)?.title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={3} alignOffset={2} align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              {option.title}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
