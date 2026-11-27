"use server"

import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"

export async function login(_previous: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
    return null
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Email atau password tidak valid, atau akses sementara dibatasi. Coba lagi nanti."
        : "Login belum dapat diproses. Silakan coba lagi."
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
