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
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Vídeos Processados",
    value: 24,
    icon: Video,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Cortes Gerados",
    value: 156,
    icon: Scissors,
    trend: { value: 23, isPositive: true },
  },
  {
    title: "Posts Agendados",
    value: 18,
    icon: Calendar,
    trend: { value: 5, isPositive: true },
  },
  {
    title: "Engajamento",
    value: "12.4K",
    icon: TrendingUp,
    trend: { value: 8, isPositive: true },
  },
]

const recentVideos = [
  {
    id: "1",
    title: "Como Ganhar Dinheiro com Marketing Digital em 2024",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
    duration: "15:32",
    cuts: 8,
    status: "completed" as const,
    createdAt: "Há 2 horas",
  },
  {
    id: "2",
    title: "Tutorial Completo de React - Do Zero ao Avançado",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
    duration: "45:18",
    cuts: 12,
    status: "completed" as const,
    createdAt: "Há 5 horas",
  },
  {
    id: "3",
    title: "Dicas de Produtividade para Programadores",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop",
    duration: "22:45",
    cuts: 0,
    status: "processing" as const,
    createdAt: "Há 1 hora",
  },
  {
    id: "4",
    title: "Análise de Mercado - Criptomoedas 2024",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop",
    duration: "18:22",
    cuts: 6,
    status: "completed" as const,
    createdAt: "Ontem",
  },
]

const scheduledPosts = [
  {
    platform: "TikTok",
    title: "Corte #3 - Marketing Digital",
    time: "Hoje, 18:00",
    color: "bg-pink-500",
  },
  {
    platform: "YouTube Shorts",
    title: "Corte #1 - React Tutorial",
    time: "Hoje, 20:00",
    color: "bg-red-500",
  },
  {
    platform: "Kwai",
    title: "Corte #5 - Produtividade",
    time: "Amanhã, 10:00",
    color: "bg-orange-500",
  },
]

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      description="Visão geral da sua conta"
    >
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recentVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
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
          <div className="mt-4 space-y-3">
            {scheduledPosts.map((post, index) => (
              <div
                key={index}
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
                    {post.platform} • {post.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Chart Placeholder */}
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
    </DashboardLayout>
  )
}
