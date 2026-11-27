"use client"

import { useActionState, useState } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"

import { login } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null)
  const [visible, setVisible] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" placeholder="nama@perusahaan.id" maxLength={254} required aria-invalid={!!error} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <InputGroup>
          <InputGroupInput id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="button" size="icon-sm" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={visible}>
              {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      {error && <p id="login-error" role="alert" className="rounded-md bg-danger-surface p-3 type-body text-danger-foreground">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  )
}
