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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR, { mutate } from "swr"

interface Integration {
  id: string
  platform: string
  platform_username: string | null
  is_active: boolean
  metadata: {
    followers?: number
    simulated?: boolean
    connectedAt?: string
  } | null
  updated_at: string
}

interface PlatformInfo {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: string[]
}

const platformsInfo: PlatformInfo[] = [
  {
    id: "tiktok",
    name: "TikTok",
    description: "Publique automaticamente no TikTok e alcance milhões de usuários",
    icon: "TT",
    color: "bg-gradient-to-br from-pink-500 to-cyan-500",
    features: ["Publicação automática", "Agendamento", "Analytics"],
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    description: "Envie shorts diretamente para seu canal do YouTube",
    icon: "YT",
    color: "bg-red-600",
    features: ["Upload automático", "Agendamento", "Thumbnails personalizadas"],
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    description: "Compartilhe reels no Instagram automaticamente",
    icon: "IG",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    features: ["Publicação automática", "Agendamento", "Stories"],
  },
  {
    id: "kwai",
    name: "Kwai",
    description: "Alcance o público do Kwai com seus vídeos curtos",
    icon: "KW",
    color: "bg-orange-500",
    features: ["Publicação automática", "Agendamento"],
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    description: "Publique reels no Facebook e expanda seu alcance",
    icon: "FB",
    color: "bg-blue-600",
    features: ["Publicação automática", "Agendamento", "Cross-posting"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Compartilhe seus vídeos curtos no X",
    icon: "X",
    color: "bg-black",
    features: ["Publicação automática", "Threads"],
  },
]

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function IntegracoesPage() {
  const { data, isLoading } = useSWR('/api/integrations', fetcher)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)

  const integrations: Integration[] = data?.integrations || []

  const getIntegrationForPlatform = (platformId: string): Integration | undefined => {
    return integrations.find(i => i.platform === platformId && i.is_active)
  }

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })
      
      if (response.ok) {
        mutate('/api/integrations')
      }
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    setDisconnectingPlatform(platformId)
    
    try {
      const response = await fetch(`/api/integrations?platform=${platformId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        mutate('/api/integrations')
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
    } finally {
      setDisconnectingPlatform(null)
    }
  }

  const connectedCount = integrations.filter(i => i.is_active).length
  
  const totalFollowers = integrations
    .filter(i => i.is_active && i.metadata?.followers)
    .reduce((acc, i) => acc + (i.metadata?.followers || 0), 0)

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
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : connectedCount}
              </p>
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
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalFollowers.toLocaleString()}
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
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : platformsInfo.length - connectedCount}
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
          {platformsInfo.map((platform) => {
            const integration = getIntegrationForPlatform(platform.id)
            return (
              <PlatformCard
                key={platform.id}
                platform={platform}
                integration={integration}
                isConnecting={connectingPlatform === platform.id}
                isDisconnecting={disconnectingPlatform === platform.id}
                onConnect={() => handleConnect(platform.id)}
                onDisconnect={() => handleDisconnect(platform.id)}
              />
            )
          })}
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
  integration,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: {
  platform: PlatformInfo
  integration?: Integration
  isConnecting: boolean
  isDisconnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  const isConnected = !!integration?.is_active
  const followers = integration?.metadata?.followers
  const lastSync = integration?.updated_at 
    ? new Date(integration.updated_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 transition-all",
        isConnected ? "border-primary/50" : "border-border"
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
            {isConnected && integration?.platform_username && (
              <p className="text-sm text-muted-foreground">{integration.platform_username}</p>
            )}
          </div>
        </div>
        {isConnected && (
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
      {isConnected && (
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {followers ? followers.toLocaleString() : '0'}
            </p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          {lastSync && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Última sincronização</p>
              <p className="text-sm text-foreground">{lastSync}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {isConnected ? (
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
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
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
                <Loader2 className="h-4 w-4 animate-spin" />
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
