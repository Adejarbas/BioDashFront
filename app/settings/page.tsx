"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type ToastVariant = "default" | "destructive"
type SupaUser = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]

// Use env quando possível (ex.: NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET)
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET?.trim() || "avatars"

// Se seu bucket for PRIVADO, mude para true
const AVATAR_BUCKET_IS_PRIVATE =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_PRIVATE === "true"

/** Mapeia erros comuns do Supabase / Storage para mensagens amigáveis */
function mapSupabaseError(err: any): { title: string; description: string; variant: ToastVariant } {
  const fallback = {
    title: "Erro",
    description: "Algo deu errado. Tente novamente.",
    variant: "destructive" as ToastVariant,
  }
  if (!err) return fallback

  const code = err.code || err?.error?.code
  const status = err.statusCode || err.status || err?.error?.statusCode || err?.error?.status
  const message = (err.message || err?.error?.message || "").toString().toLowerCase()

  if (code === "PGRST205" || message.includes("could not find the table")) {
    return {
      title: "Tabela não encontrada",
      description:
        "A tabela 'public.user_profiles' não foi encontrada pelo PostgREST. Confirme o nome e faça Reset API cache nas configurações do Supabase.",
      variant: "destructive",
    }
  }
  if (code === "PGRST204" || (message.includes("could not find the") && message.includes("column"))) {
    return {
      title: "Coluna não encontrada",
      description:
        "Uma coluna referenciada não existe no schema. Verifique se 'avatar_url' existe em public.user_profiles e recarregue o cache da API.",
      variant: "destructive",
    }
  }
  if (status === 404 || message.includes("bucket not found")) {
    return {
      title: "Bucket não encontrado",
      description:
        "O bucket do Storage não foi encontrado. Verifique o nome do bucket e se o projeto/ENV (URL e ANON KEY) estão corretos.",
      variant: "destructive",
    }
  }
  if (
    status === 403 ||
    message.includes("row-level security") ||
    message.includes("violates row-level security")
  ) {
    return {
      title: "Permissão negada",
      description:
        "A política de segurança (RLS) bloqueou a operação. Verifique as policies em storage.objects e user_profiles para o usuário atual.",
      variant: "destructive",
    }
  }
  if (status === 413 || message.includes("payload too large")) {
    return {
      title: "Arquivo muito grande",
      description: "O arquivo excede o limite permitido pelo Storage.",
      variant: "destructive",
    }
  }
  if (message.includes("jwt") || message.includes("token") || message.includes("auth")) {
    return {
      title: "Sessão expirada",
      description: "Sua sessão pode ter expirado. Entre novamente para continuar.",
      variant: "destructive",
    }
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      title: "Sem conexão",
      description: "Você está offline. Conecte-se à internet e tente novamente.",
      variant: "destructive",
    }
  }
  return {
    title: "Erro",
    description: err?.message || "Não foi possível completar a operação.",
    variant: "destructive",
  }
}

function safeToastError(toast: ReturnType<typeof useToast>["toast"], err: any, override?: string) {
  const mapped = mapSupabaseError(err)
  toast({
    title: mapped.title,
    description: override || mapped.description,
    variant: mapped.variant,
  })
}

// logger silencioso (sem console/window/globalThis)
const debugError = (_message?: string, _error?: any) => {}

const emptyToNull = (v?: string | null) => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}
const displayOrDash = (v?: string | null) => {
  if (v === undefined || v === null) return "—"
  const s = String(v).trim()
  return s.length ? s : "—"
}

// Garante que o usuário tenha uma linha em public.user_profiles
async function ensureProfileRow(user: SupaUser) {
  const { error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (error) {
    const notFound =
      error.code === "PGRST116" ||
      /no rows?|Results contain 0 rows/i.test(error.message || "")
    if (notFound) {
      const { error: insertErr } = await supabase.from("user_profiles").insert({
        id: user.id,
        name: "",
        email: user.email, // se existir coluna email no perfil
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (insertErr) throw insertErr
      return
    }
    throw error
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<SupaUser | null>(null)

  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Avatar input
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Avaliação (localStorage)
  const [isOpen, setIsOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [estrelas, setEstrelas] = useState(0)

  const [profileData, setProfileData] = useState({
    name: "",
    company: "",
    email: "",
    avatar: "/abstract-profile.png",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    cnpj: "",
    razao_social: "",
    numero: "",
    phone: "",
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          toast({
            title: "Sem conexão",
            description: "Você está offline. Algumas informações podem não carregar.",
          })
        }

        const { data, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        const currentUser = data?.user
        if (!currentUser) {
          toast({
            title: "Não autenticado",
            description: "Entre na sua conta para acessar as configurações.",
            variant: "destructive",
          })
          router.replace("/login")
          return
        }

        setUser(currentUser)

        await ensureProfileRow(currentUser)

        const { data: userData, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single()

        if (error) throw error

        setProfileData({
          name: userData?.name || "",
          company: userData?.company || "",
          email: currentUser.email || "",
          avatar: userData?.avatar_url || "/abstract-profile.png",
          address: userData?.address || "",
          city: userData?.city || "",
          state: userData?.state || "",
          zipCode: userData?.zip_code || "",
          cnpj: userData?.cnpj || "",
          razao_social: userData?.razao_social || "",
          numero: userData?.numero?.toString?.() || "",
          phone: userData?.phone || "",
        })
      } catch (err: any) {
        debugError("Erro ao carregar usuário/perfil:", err)
        safeToastError(toast, err, "Não foi possível carregar suas informações de perfil.")
      }
    }
    loadUserData()
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Entre na sua conta para atualizar o perfil.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("OFFLINE")
      }

      await ensureProfileRow(user)

      const numeroSan = (profileData.numero || "").trim()
      const numeroValue =
        numeroSan && /^\d+$/.test(numeroSan) ? Number(numeroSan) : null

      const payload: Record<string, any> = {
        id: user.id,
        name: emptyToNull(profileData.name),
        company: emptyToNull(profileData.company),
        address: emptyToNull(profileData.address),
        city: emptyToNull(profileData.city),
        state: emptyToNull(profileData.state),
        zip_code: emptyToNull(profileData.zipCode),
        cnpj: emptyToNull(profileData.cnpj),
        razao_social: emptyToNull(profileData.razao_social),
        numero: numeroValue, // se TEXT no DB, troque para emptyToNull(profileData.numero)
        phone: emptyToNull(profileData.phone),
        updated_at: new Date().toISOString(),
      }
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

      const { data: row, error } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single()

      if (error) throw error

      setProfileData((prev) => ({
        ...prev,
        name: row?.name || "",
        company: row?.company || "",
        address: row?.address || "",
        city: row?.city || "",
        state: row?.state || "",
        zipCode: row?.zip_code || "",
        cnpj: row?.cnpj || "",
        razao_social: row?.razao_social || "",
        numero: row?.numero?.toString?.() || "",
        phone: row?.phone || "",
      }))

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (err: any) {
      debugError("Erro ao atualizar perfil:", err)
      if (err?.message === "OFFLINE") {
        toast({
          title: "Sem conexão",
          description: "Conecte-se à internet para salvar as alterações.",
          variant: "destructive",
        })
      } else {
        safeToastError(toast, err, "Não foi possível atualizar o perfil.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("OFFLINE")
      }
      if (!newPassword || newPassword.length < 8) {
        throw new Error("PASSWORD_WEAK")
      }
      if (newPassword !== confirmPassword) {
        throw new Error("PASSWORD_MISMATCH")
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      })
    } catch (err: any) {
      debugError("Erro ao alterar senha:", err)
      if (err?.message === "OFFLINE") {
        toast({
          title: "Sem conexão",
          description: "Conecte-se à internet para alterar a senha.",
          variant: "destructive",
        })
      } else if (err?.message === "PASSWORD_WEAK") {
        toast({
          title: "Senha fraca",
          description: "Use ao menos 8 caracteres (misture letras, números e símbolos).",
          variant: "destructive",
        })
      } else if (err?.message === "PASSWORD_MISMATCH") {
        toast({
          title: "Confirmação incorreta",
          description: "Os campos de nova senha e confirmação não coincidem.",
          variant: "destructive",
        })
      } else {
        safeToastError(toast, err, "Não foi possível alterar a senha.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Entre na sua conta para enviar a foto.",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current = previewUrl
    setAvatarPreview(previewUrl)

    setIsLoading(true)
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("OFFLINE")
      }
      if (file.size > 2 * 1024 * 1024) throw new Error("MAX_2MB")
      if (!/^image\/(png|jpe?g|gif)$/i.test(file.type)) throw new Error("BAD_TYPE")

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const unique =
        (globalThis.crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
      const filePath = `${user.id}/${unique}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        // mapeia 404 de bucket
        // @ts-ignore
        const status = uploadError?.statusCode || uploadError?.status
        if (status === 404) {
          const e404 = new Error("BUCKET_NOT_FOUND")
          // @ts-ignore
          ;(e404 as any).status = 404
          throw e404
        }
        throw uploadError
      }

      let publicUrl: string
      if (AVATAR_BUCKET_IS_PRIVATE) {
        const signed = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filePath, 60 * 60 * 24)
        if (signed.error || !signed.data?.signedUrl) throw signed.error
        publicUrl = signed.data.signedUrl
      } else {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
        publicUrl = data.publicUrl
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .upsert(
          { id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        )

      if (updateError) throw updateError

      setProfileData((prev) => ({ ...prev, avatar: publicUrl }))
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi alterada com sucesso.",
      })
    } catch (err: any) {
      setAvatarPreview(null)
      if (err?.message === "OFFLINE") {
        toast({
          title: "Sem conexão",
          description: "Conecte-se à internet para enviar a foto.",
          variant: "destructive",
        })
      } else if (err?.message === "MAX_2MB") {
        toast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo permitido é 2MB.",
          variant: "destructive",
        })
      } else if (err?.message === "BAD_TYPE") {
        toast({
          title: "Formato inválido",
          description: "Use JPG, PNG ou GIF.",
          variant: "destructive",
        })
      } else if (err?.message === "BUCKET_NOT_FOUND" || (err as any)?.status === 404) {
        toast({
          title: "Bucket não encontrado",
          description:
            "Verifique o nome do bucket de Storage e as variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.",
          variant: "destructive",
        })
      } else {
        safeToastError(toast, err, "Não foi possível fazer upload da foto.")
      }
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast({
        title: "Sem conexão",
        description: "Você está offline. Conecte-se para enviar uma nova foto.",
        variant: "destructive",
      })
      return
    }
    fileInputRef.current?.click()
  }

  const handleEnviarAvaliacao = () => {
    const novaAvaliacao = {
      titulo,
      descricao,
      estrelas,
      usuario: profileData.name || "Usuário",
      foto: profileData.avatar,
      createdAt: new Date().toISOString(),
    }
    const avaliacoes = JSON.parse(localStorage.getItem("avaliacoes") || "[]")
    avaliacoes.push(novaAvaliacao)
    localStorage.setItem("avaliacoes", JSON.stringify(avaliacoes))
    setIsOpen(false)
    setTitulo("")
    setDescricao("")
    setEstrelas(0)
    toast({ title: "Obrigado!", description: "Sua avaliação foi registrada." })
  }

  const initials =
    profileData.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "US"

  return (
    <DashboardShell>
      <div className="flex justify-end w-full mt-4 mb-2 pr-8">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-green-600"
              onClick={() => setIsOpen(true)}
            >
              Avalie nosso Sistema
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Deixe sua avaliação</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                handleEnviarAvaliacao()
              }}
            >
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Ótimo sistema!"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <textarea
                  id="descricao"
                  className="w-full border rounded p-2"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Conte sua experiência..."
                  required
                />
              </div>
              <div>
                <Label>Nota</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-2xl"
                      onClick={() => setEstrelas(star)}
                      aria-label={`Dar ${star} estrela${star > 1 ? "s" : ""}`}
                    >
                      <span className={star <= estrelas ? "text-yellow-400" : "text-gray-300"}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Enviar avaliação</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DashboardHeader heading="Configurações" text="Gerencie suas informações pessoais e configurações da conta" />

      <div className="grid gap-6">
        {/* ---------- NOVO: CARD DE RESUMO (LEITURA) ---------- */}
        <Card className="bio-card">
          <CardHeader>
            <CardTitle className="text-green-800">Resumo do Perfil</CardTitle>
            <CardDescription className="text-green-600">
              Informações atuais salvas no banco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt="Foto do perfil" />
                <AvatarFallback className="bg-green-100 text-green-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold text-green-800">
                  {displayOrDash(profileData.name)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {displayOrDash(profileData.email)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {displayOrDash(profileData.company)}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">Razão Social</div>
                <div className="text-sm">{displayOrDash(profileData.razao_social)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">CNPJ</div>
                <div className="text-sm">{displayOrDash(profileData.cnpj)}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs uppercase text-muted-foreground">Endereço</div>
                <div className="text-sm">
                  {displayOrDash(profileData.address)}{" "}
                  {profileData.numero ? `, ${profileData.numero}` : ""}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">Cidade</div>
                <div className="text-sm">{displayOrDash(profileData.city)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">Estado</div>
                <div className="text-sm">{displayOrDash(profileData.state)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">CEP</div>
                <div className="text-sm">{displayOrDash(profileData.zipCode)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">Telefone</div>
                <div className="text-sm">{displayOrDash(profileData.phone)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- FORM DE EDIÇÃO ---------- */}
        <Card className="bio-card">
          <CardHeader>
            <CardTitle className="text-green-800">Informações do Perfil</CardTitle>
            <CardDescription className="text-green-600">
              Atualize suas informações pessoais e da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatarPreview || profileData.avatar || "/placeholder.svg"}
                  alt="Foto do perfil"
                />
                <AvatarFallback className="bg-green-100 text-green-800 text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  type="button"
                  onClick={openFileDialog}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Alterar Foto"}
                </Button>

                <Input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />

                <p className="text-sm text-green-600 mt-1">
                  JPG, PNG ou GIF (máx. 2MB){AVATAR_BUCKET_IS_PRIVATE ? " • Bucket privado" : ""}
                </p>
              </div>
            </div>

            {/* Form de perfil */}
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-green-800">
                    Nome do Usuário
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-green-800">
                    Nome Fantasia
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, company: e.target.value }))
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao_social" className="text-green-800">
                    Razão Social
                  </Label>
                  <Input
                    id="razao_social"
                    value={profileData.razao_social}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, razao_social: e.target.value }))
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-green-800">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={profileData.cnpj}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "")
                      v = v.replace(/(\d{2})(\d)/, "$1.$2")
                      v = v.replace(/(\d{3})(\d)/, "$1.$2")
                      v = v.replace(/(\d{3})(\d)/, "$1/$2")
                      v = v.replace(/(\d{4})(\d)/, "$1-$2")
                      setProfileData((prev) => ({ ...prev, cnpj: v }))
                    }}
                    className="border-green-300 focus:border-green-500"
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-800">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  readOnly
                  className="border-green-300 bg-muted/30 text-muted-foreground"
                  title="O e-mail é gerenciado pela autenticação"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-green-800">Endereço da Empresa</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address" className="text-green-800">
                      Endereço Completo
                    </Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="border-green-300 focus:border-green-500"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-green-800">
                      Número
                    </Label>
                    <Input
                      id="numero"
                      value={profileData.numero}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, numero: e.target.value }))
                      }
                      className="border-green-300 focus:border-green-500"
                      placeholder="Número"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-green-800">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-green-800">
                      Estado
                    </Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="border-green-300 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-green-800">
                      CEP
                    </Label>
                    <Input
                      id="zipCode"
                      value={profileData.zipCode}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "")
                        v = v.replace(/(\d{5})(\d)/, "$1-$2")
                        setProfileData((prev) => ({ ...prev, zipCode: v }))
                      }}
                      className="border-green-300 focus:border-green-500"
                      placeholder="00000-000"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-green-800">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone || ""}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "")
                    v = v.length > 10
                      ? v.replace(/(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
                      : v.replace(/(\d{2})(\d{4})(\d{4}).*/, "($1) $2-$3")
                    setProfileData((prev) => ({ ...prev, phone: v }))
                  }}
                  className="border-green-300 focus:border-green-500"
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="bio-card">
          <CardHeader>
            <CardTitle className="text-green-800">Alterar Senha</CardTitle>
            <CardDescription className="text-green-600">
              Mantenha sua conta segura com uma senha forte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-green-800">
                  Senha Atual
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-green-300 focus:border-green-500"
                  autoComplete="current-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-green-800">
                    Nova Senha
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-green-300 focus:border-green-500"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-green-800">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-green-300 focus:border-green-500"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
