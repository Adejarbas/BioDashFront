"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Leaf, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email) {
      setError("Por favor, informe seu email.")
      setIsLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setEmailSent(true)
    setTimeout(() => {
      router.push("/")
    }, 3000)
  }

  return (
    <>
      {/* Header fixo com logo que volta para a home */}
      <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="h-7 w-7 text-green-600 transition-transform group-hover:scale-110" />
            <span className="text-xl font-semibold tracking-tight">BioDash</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-20">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              Recuperar Senha
            </CardTitle>
            <CardDescription>
              {emailSent
                ? "Link enviado! Redirecionando..."
                : "Informe seu email para receber o link de recuperação"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 text-center">
                    ✓ Um link de recuperação foi enviado para seu email. Verifique sua caixa de
                    entrada.
                  </p>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Você será redirecionado para a página inicial em instantes...
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                  {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
                </form>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}