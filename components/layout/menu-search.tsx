"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { navigationGroups } from "./navigation"

// Menu search works now; inventory search needs real master data.
export function MenuSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label="Cari menu"
          className="size-control shrink-0 p-0 pointer-coarse:size-control-touch lg:w-auto lg:justify-start lg:px-3"
        >
          <Search aria-hidden="true" />
          <span className="hidden lg:inline">Cari menu</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cari menu</DialogTitle>
          <DialogDescription>
            Buka halaman E-Gudang. Pencarian nama barang, SKU, dan barcode tersedia setelah master data dibuat.
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Ketik nama menu..." aria-label="Nama menu" />
          <CommandList>
            <CommandEmpty>Menu tidak ditemukan.</CommandEmpty>
            {navigationGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      onSelect={() => {
                        setOpen(false)
                        router.push(item.href)
                      }}
                    >
                      <Icon aria-hidden="true" />
                      {item.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
