"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Clock,
  Trash2,
  Edit3,
  Copy,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduledPost {
  id: string
  title: string
  thumbnail: string
  platform: string
  platformColor: string
  time: string
  date: Date
}

const platforms = [
  { name: "TikTok", color: "bg-pink-500", icon: "TT" },
  { name: "YouTube Shorts", color: "bg-red-500", icon: "YT" },
  { name: "Instagram Reels", color: "bg-gradient-to-br from-purple-500 to-pink-500", icon: "IG" },
  { name: "Kwai", color: "bg-orange-500", icon: "KW" },
  { name: "Facebook Reels", color: "bg-blue-600", icon: "FB" },
]

const generateMockPosts = (): ScheduledPost[] => {
  const posts: ScheduledPost[] = []
  const today = new Date()
  
  const mockData = [
    { title: "Corte #1 - Marketing Digital", platform: "TikTok", color: "bg-pink-500" },
    { title: "Corte #2 - React Tutorial", platform: "YouTube Shorts", color: "bg-red-500" },
    { title: "Corte #3 - Produtividade", platform: "Kwai", color: "bg-orange-500" },
    { title: "Corte #4 - Dicas de Dev", platform: "Instagram Reels", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
    { title: "Corte #5 - Investimentos", platform: "TikTok", color: "bg-pink-500" },
    { title: "Corte #6 - Carreira Tech", platform: "YouTube Shorts", color: "bg-red-500" },
  ]
  
  mockData.forEach((data, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + Math.floor(index / 2))
    date.setHours(10 + (index % 3) * 4)
    
    posts.push({
      id: `post-${index + 1}`,
      title: data.title,
      thumbnail: `https://images.unsplash.com/photo-${1611162617474 + index * 1000}-5b21e879e113?w=100&h=178&fit=crop`,
      platform: data.platform,
      platformColor: data.color,
      time: `${String(date.getHours()).padStart(2, "0")}:00`,
      date,
    })
  })
  
  return posts
}

const mockScheduledPosts = generateMockPosts()

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function AgendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getPostsForDate = (date: Date) => {
    return mockScheduledPosts.filter(
      (post) =>
        post.date.getDate() === date.getDate() &&
        post.date.getMonth() === date.getMonth() &&
        post.date.getFullYear() === date.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const days = getDaysInMonth(currentDate)

  return (
    <DashboardLayout
      title="Agendar Posts"
      description="Planeje e agende seus cortes para publicação automática"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mt-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }

                  const posts = getPostsForDate(day)
                  const today = isToday(day)
                  const isSelected =
                    selectedDate &&
                    day.getDate() === selectedDate.getDate() &&
                    day.getMonth() === selectedDate.getMonth()

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "group relative aspect-square rounded-lg border p-1 text-left transition-all hover:border-primary/50",
                        today ? "border-primary bg-primary/5" : "border-transparent",
                        isSelected && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          today
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {day.getDate()}
                      </span>

                      {/* Post indicators */}
                      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                        {posts.slice(0, 3).map((post, i) => (
                          <div
                            key={post.id}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              post.platformColor
                            )}
                            title={`${post.platform}: ${post.title}`}
                          />
                        ))}
                        {posts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{posts.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Platform Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Plataformas:</span>
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", platform.color)} />
                  <span className="text-xs text-muted-foreground">
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Selected Day / Upcoming */}
        <div className="space-y-6">
          {/* New Post Button */}
          <Button
            className="w-full gap-2"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus className="h-4 w-4" />
            Agendar Novo Post
          </Button>

          {/* Selected Day Posts */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {selectedDate
                ? `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`
                : "Próximos Posts"}
            </h3>

            <div className="mt-4 space-y-3">
              {(selectedDate
                ? getPostsForDate(selectedDate)
                : mockScheduledPosts.slice(0, 5)
              ).map((post) => (
                <div
                  key={post.id}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 transition-all hover:border-primary/50"
                >
                  {/* Thumbnail */}
                  <div className="relative h-12 w-7 shrink-0 overflow-hidden rounded">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          post.platformColor
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {post.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {post.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit3 className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Copy className="h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {selectedDate && getPostsForDate(selectedDate).length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum post agendado para este dia
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Agendar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {mockScheduledPosts.length}
              </p>
              <p className="text-xs text-muted-foreground">Posts Agendados</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {new Set(mockScheduledPosts.map((p) => p.platform)).size}
              </p>
              <p className="text-xs text-muted-foreground">Plataformas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal onClose={() => setShowScheduleModal(false)} />
      )}
    </DashboardLayout>
  )
}

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("18:00")
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Agendar Novo Post
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Select Cut */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Selecionar Corte
            </label>
            <select className="mt-2 h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Corte #1 - Marketing Digital</option>
              <option>Corte #2 - React Tutorial</option>
              <option>Corte #3 - Produtividade</option>
              <option>Corte #4 - Dicas de Dev</option>
            </select>
          </div>

          {/* Select Platforms */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Plataformas
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => togglePlatform(platform.name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                    selectedPlatforms.includes(platform.name)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <div className={cn("h-3 w-3 rounded-full", platform.color)} />
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Horário
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Legenda (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Adicione uma legenda para o post..."
              className="mt-2 w-full rounded-lg border border-input bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={selectedPlatforms.length === 0}
            onClick={onClose}
          >
            Agendar Post
          </Button>
        </div>
      </div>
    </div>
  )
}
