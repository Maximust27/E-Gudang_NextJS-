"use client"

import { useId, type ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FilterSelect({ name, label, value, children }: {
  name: string
  label: string
  value: string
  children: ReactNode
}) {
  const id = useId()

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1">
      <Label htmlFor={id} className="type-caption text-muted-foreground">{label}</Label>
      <Select name={name} defaultValue={value}>
        <SelectTrigger id={id} className="w-full min-w-0 gap-3 bg-card px-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" sideOffset={4}>
          <SelectGroup>{children}</SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
