"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/stats-card"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import {
  Video,
  Scissors,
  Calendar,
  TrendingUp,
  Upload,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatDuration(seconds: number | null): string {
  if (!seconds) return "00:00"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  if (diffDays === 1) return "Ontem"
  return `Há ${diffDays} dias`
}

const platformColors: Record<string, string> = {
  tiktok: "bg-pink-500",
  youtube: "bg-red-500",
  instagram: "bg-purple-500",
  kwai: "bg-orange-500",
  facebook: "bg-blue-500",
  twitter: "bg-sky-500",
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000
  })

  const stats = [
    {
      title: "Vídeos Processados",
      value: data?.stats?.totalVideos ?? 0,
      icon: Video,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Cortes Gerados",
      value: data?.stats?.totalClips ?? 0,
      icon: Scissors,
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Posts Agendados",
      value: data?.stats?.scheduledPosts ?? 0,
      icon: Calendar,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Engajamento",
      value: data?.stats?.totalEngagement 
        ? data.stats.totalEngagement >= 1000 
          ? `${(data.stats.totalEngagement / 1000).toFixed(1)}K`
          : data.stats.totalEngagement
        : 0,
      icon: TrendingUp,
      trend: { value: Number(data?.stats?.engagementRate) || 0, isPositive: true },
    },
  ]

  const recentVideos = (data?.recentVideos || []).map((video: {
    id: string
    title: string
    thumbnail_url: string | null
    status: string
    created_at: string
    duration?: number
    clips?: { count: number }[]
  }) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
    duration: formatDuration(video.duration || null),
    cuts: video.clips?.[0]?.count ?? 0,
    status: video.status as "pending" | "processing" | "completed" | "failed",
    createdAt: formatTimeAgo(video.created_at),
  }))

  const scheduledPosts = (data?.upcomingPosts || []).map((post: {
    id: string
    platform: string
    scheduled_for: string
    clip?: { title: string }
  }) => ({
    id: post.id,
    platform: post.platform.charAt(0).toUpperCase() + post.platform.slice(1),
    title: post.clip?.title || "Corte agendado",
    time: new Date(post.scheduled_for).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    color: platformColors[post.platform] || "bg-gray-500",
  }))

  if (error) {
    return (
      <DashboardLayout title="Dashboard" description="Visão geral da sua conta">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Erro ao carregar dados. Faça login para continuar.</p>
          <Link href="/auth/login" className="mt-4">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard"
      description="Visão geral da sua conta"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/upload">
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Novo Upload
              </Button>
            </Link>
            <Link href="/cortes">
              <Button variant="outline" className="gap-2">
                <Scissors className="h-4 w-4" />
                Ver Todos os Cortes
              </Button>
            </Link>
            <Link href="/agendar">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Agendar Posts
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Recent Videos */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Vídeos Recentes
                </h2>
                <Link href="/upload">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Ver todos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {recentVideos.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {recentVideos.map((video: {
                    id: string
                    title: string
                    thumbnail: string
                    duration: string
                    cuts: number
                    status: "pending" | "processing" | "completed" | "failed"
                    createdAt: string
                  }) => (
                    <VideoCard key={video.id} {...video} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Nenhum vídeo ainda</p>
                  <Link href="/upload" className="mt-4">
                    <Button size="sm">Fazer Upload</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Scheduled Posts */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Próximos Posts
                </h2>
                <Link href="/agendar">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Ver todos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {scheduledPosts.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {scheduledPosts.map((post: {
                    id: string
                    platform: string
                    title: string
                    time: string
                    color: string
                  }) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50"
                    >
                      <div
                        className={`h-10 w-10 shrink-0 rounded-lg ${post.color} flex items-center justify-center`}
                      >
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {post.platform} - {post.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum post agendado</p>
                </div>
              )}

              {/* Activity Chart */}
              <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-card-foreground">
                  Atividade Semanal
                </h3>
                <div className="mt-4 flex items-end justify-between gap-2">
                  {[40, 65, 45, 80, 55, 70, 90].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {["S", "T", "Q", "Q", "S", "S", "D"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
