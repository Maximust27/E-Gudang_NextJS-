import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
