import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** Owns the page's outer padding and section rhythm. */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6", className)}
      {...props}
    />
  )
}
