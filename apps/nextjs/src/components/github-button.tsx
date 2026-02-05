import { cn } from '@acme/ui'
import { Button } from '@acme/ui/button'

import { GithubIcon } from './icons/github'

interface GithubButtonProps {
  className?: string
}

export const GithubButton = ({ className }: GithubButtonProps) => (
  <Button asChild variant="ghost" className={cn('aspect-square h-8 px-0', className)}>
    <a href="https://github.com/ryanpwaldon/wvis" target="_blank" rel="noopener noreferrer">
      <GithubIcon className="h-4 w-4" />
    </a>
  </Button>
)
