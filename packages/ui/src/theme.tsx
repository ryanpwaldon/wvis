'use client'

import * as React from 'react'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { ThemeProvider, useTheme } from 'next-themes'

import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'

function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SunIcon className="size-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute size-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={2} alignOffset={2}>
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeProvider, ThemeToggle }
