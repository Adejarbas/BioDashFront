"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-12">
      <Card className="w-full max-w-md border-green-100 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-green-100 p-3">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Login</CardTitle>
          <CardDescription className="text-green-600">
            Entre com suas credenciais para acessar seu dashboard
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{state.error}</div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <p className="font-medium mb-1">Credenciais de Demonstração:</p>
              <p>
                <strong>Email:</strong> demo@biodigester.com
              </p>
              <p>
                <strong>Senha:</strong> demo123456
              </p>
              <p className="text-xs mt-1 text-blue-600">
                Registre-se primeiro com essas credenciais. Login imediato após registro (sem confirmação por email).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="exemplo@example.com"
                required
                className="border-green-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-green-700">
                  Senha
                </Label>
                <Link href="#" className="text-sm text-green-600 hover:text-green-800 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="border-green-200 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-green-700 hover:text-green-900"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-green-300" />
              <Label htmlFor="remember" className="text-sm font-normal text-green-700">
                Lembrar-me
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <SubmitButton />
            <div className="text-center text-sm text-green-700">
              Não tem uma conta?{" "}
              <Link href="/register" className="font-medium text-green-600 hover:text-green-800 hover:underline">
                Registre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
