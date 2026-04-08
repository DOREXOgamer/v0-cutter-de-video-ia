"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Settings,
  AlertCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Platform {
  id: string
  name: string
  description: string
  icon: string
  color: string
  connected: boolean
  username?: string
  followers?: string
  lastSync?: string
  features: string[]
}

const platforms: Platform[] = [
  {
    id: "tiktok",
    name: "TikTok",
    description: "Publique automaticamente no TikTok e alcance milhões de usuários",
    icon: "TT",
    color: "bg-gradient-to-br from-pink-500 to-cyan-500",
    connected: true,
    username: "@seuusuario",
    followers: "12.5K",
    lastSync: "Há 5 minutos",
    features: ["Publicação automática", "Agendamento", "Analytics"],
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    description: "Envie shorts diretamente para seu canal do YouTube",
    icon: "YT",
    color: "bg-red-600",
    connected: true,
    username: "Seu Canal",
    followers: "8.2K",
    lastSync: "Há 10 minutos",
    features: ["Upload automático", "Agendamento", "Thumbnails personalizadas"],
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    description: "Compartilhe reels no Instagram automaticamente",
    icon: "IG",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    connected: false,
    features: ["Publicação automática", "Agendamento", "Stories"],
  },
  {
    id: "kwai",
    name: "Kwai",
    description: "Alcance o público do Kwai com seus vídeos curtos",
    icon: "KW",
    color: "bg-orange-500",
    connected: true,
    username: "@kwaiuser",
    followers: "5.3K",
    lastSync: "Há 1 hora",
    features: ["Publicação automática", "Agendamento"],
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    description: "Publique reels no Facebook e expanda seu alcance",
    icon: "FB",
    color: "bg-blue-600",
    connected: false,
    features: ["Publicação automática", "Agendamento", "Cross-posting"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Compartilhe seus vídeos curtos no X",
    icon: "X",
    color: "bg-black",
    connected: false,
    features: ["Publicação automática", "Threads"],
  },
]

export default function IntegracoesPage() {
  const [platformList, setPlatformList] = useState(platforms)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setPlatformList((prev) =>
      prev.map((p) =>
        p.id === platformId
          ? {
              ...p,
              connected: true,
              username: "@novousuario",
              followers: "0",
              lastSync: "Agora",
            }
          : p
      )
    )
    setConnectingPlatform(null)
  }

  const handleDisconnect = (platformId: string) => {
    setPlatformList((prev) =>
      prev.map((p) =>
        p.id === platformId
          ? {
              ...p,
              connected: false,
              username: undefined,
              followers: undefined,
              lastSync: undefined,
            }
          : p
      )
    )
  }

  const connectedCount = platformList.filter((p) => p.connected).length

  return (
    <DashboardLayout
      title="Integrações"
      description="Conecte suas contas para publicação automática"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
              <p className="text-sm text-muted-foreground">Plataformas Conectadas</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {platformList
                  .filter((p) => p.connected && p.followers)
                  .reduce((acc, p) => {
                    const num = parseFloat(p.followers!.replace(/[^0-9.]/g, ""))
                    const multiplier = p.followers!.includes("K") ? 1000 : 1
                    return acc + num * multiplier
                  }, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Seguidores Totais</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {platformList.length - connectedCount}
              </p>
              <p className="text-sm text-muted-foreground">Aguardando Conexão</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          Todas as Plataformas
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformList.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              isConnecting={connectingPlatform === platform.id}
              onConnect={() => handleConnect(platform.id)}
              onDisconnect={() => handleDisconnect(platform.id)}
            />
          ))}
        </div>
      </div>

      {/* API Keys Section */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Configurações Avançadas
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure APIs personalizadas para integrações avançadas
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                API Key do YouTube
              </p>
              <p className="text-xs text-muted-foreground">
                Necessária para funcionalidades avançadas
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Webhook de Notificações
              </p>
              <p className="text-xs text-muted-foreground">
                Receba notificações em tempo real
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Integração com Zapier
              </p>
              <p className="text-xs text-muted-foreground">
                Automatize workflows com outras ferramentas
              </p>
            </div>
            <Button variant="outline" size="sm">
              Conectar
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function PlatformCard({
  platform,
  isConnecting,
  onConnect,
  onDisconnect,
}: {
  platform: Platform
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 transition-all",
        platform.connected ? "border-primary/50" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white",
              platform.color
            )}
          >
            {platform.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{platform.name}</h3>
            {platform.connected && platform.username && (
              <p className="text-sm text-muted-foreground">{platform.username}</p>
            )}
          </div>
        </div>
        {platform.connected && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-primary">Conectado</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-muted-foreground">{platform.description}</p>

      {/* Features */}
      <div className="mt-4 flex flex-wrap gap-2">
        {platform.features.map((feature) => (
          <span
            key={feature}
            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Stats (if connected) */}
      {platform.connected && (
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {platform.followers}
            </p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Última sincronização</p>
            <p className="text-sm text-foreground">{platform.lastSync}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {platform.connected ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 gap-1">
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={onDisconnect}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            className="w-full gap-2"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Conectar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
