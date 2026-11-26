"use client"

import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Sun, Moon, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Home() {
  const { setTheme } = useTheme()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="type-page-title">
          E-Gudang Design System
        </h1>

        <p className="type-body text-muted-foreground">
          Global providers and theme preview.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setTheme("light")}
        >
          <Sun />
          Light
        </Button>

        <Button
          variant="outline"
          onClick={() => setTheme("dark")}
        >
          <Moon />
          Dark
        </Button>

        <Button
          variant="outline"
          onClick={() => setTheme("system")}
        >
          <Monitor />
          System
        </Button>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() =>
              toast.success("Global providers berfungsi!")
            }
          >
            Test Notification
          </Button>
        </TooltipTrigger>

        <TooltipContent>
          Klik untuk menguji notifikasi
        </TooltipContent>
      </Tooltip>
    </main>
  )
}