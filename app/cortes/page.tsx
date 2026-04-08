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
  Play,
  Download,
  Share2,
  MoreVertical,
  Filter,
  Search,
  Grid,
  List,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"
type FilterStatus = "all" | "ready" | "scheduled" | "posted"

interface Cut {
  id: string
  title: string
  thumbnail: string
  duration: string
  originalVideo: string
  status: "ready" | "scheduled" | "posted"
  scheduledFor?: string
  postedOn?: string[]
  views?: number
  createdAt: string
}

const mockCuts: Cut[] = [
  {
    id: "1",
    title: "Corte #1 - A Melhor Estratégia de Marketing",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=711&fit=crop",
    duration: "0:42",
    originalVideo: "Marketing Digital 2024",
    status: "posted",
    postedOn: ["TikTok", "YouTube Shorts"],
    views: 12400,
    createdAt: "Há 2 dias",
  },
  {
    id: "2",
    title: "Corte #2 - Como Começar do Zero",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=711&fit=crop",
    duration: "0:58",
    originalVideo: "Marketing Digital 2024",
    status: "scheduled",
    scheduledFor: "Hoje, 18:00",
    createdAt: "Há 2 dias",
  },
  {
    id: "3",
    title: "Corte #3 - Dica de Produtividade",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=711&fit=crop",
    duration: "0:35",
    originalVideo: "Produtividade para Devs",
    status: "ready",
    createdAt: "Há 1 dia",
  },
  {
    id: "4",
    title: "Corte #4 - React Hooks Explicado",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=711&fit=crop",
    duration: "0:48",
    originalVideo: "Tutorial React",
    status: "ready",
    createdAt: "Há 1 dia",
  },
  {
    id: "5",
    title: "Corte #5 - Erro Comum de Iniciantes",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=711&fit=crop",
    duration: "0:52",
    originalVideo: "Tutorial React",
    status: "posted",
    postedOn: ["Kwai"],
    views: 5200,
    createdAt: "Há 3 dias",
  },
  {
    id: "6",
    title: "Corte #6 - Investimentos para 2024",
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=711&fit=crop",
    duration: "0:44",
    originalVideo: "Análise de Mercado",
    status: "scheduled",
    scheduledFor: "Amanhã, 10:00",
    createdAt: "Há 5 horas",
  },
]

const statusConfig = {
  ready: {
    label: "Pronto",
    color: "bg-blue-500/20 text-blue-400",
    icon: CheckCircle,
  },
  scheduled: {
    label: "Agendado",
    color: "bg-yellow-500/20 text-yellow-400",
    icon: Clock,
  },
  posted: {
    label: "Publicado",
    color: "bg-primary/20 text-primary",
    icon: CheckCircle,
  },
}

export default function CortesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuts, setSelectedCuts] = useState<string[]>([])

  const filteredCuts = mockCuts.filter((cut) => {
    if (filter !== "all" && cut.status !== filter) return false
    if (searchQuery && !cut.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleCutSelection = (id: string) => {
    setSelectedCuts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleAllSelection = () => {
    if (selectedCuts.length === filteredCuts.length) {
      setSelectedCuts([])
    } else {
      setSelectedCuts(filteredCuts.map((c) => c.id))
    }
  }

  return (
    <DashboardLayout
      title="Cortes Gerados"
      description="Gerencie todos os seus cortes em um só lugar"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cortes..."
              className="h-9 w-64 rounded-lg border border-input bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filter === "all" ? "Todos" : statusConfig[filter].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter("all")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("ready")}>
                Prontos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("scheduled")}>
                Agendados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("posted")}>
                Publicados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedCuts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCuts.length} selecionado(s)
              </span>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Agendar
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Baixar
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={toggleAllSelection}
          className={cn(
            "h-5 w-5 rounded border transition-colors",
            selectedCuts.length === filteredCuts.length && filteredCuts.length > 0
              ? "border-primary bg-primary"
              : "border-border bg-secondary hover:border-primary/50"
          )}
        >
          {selectedCuts.length === filteredCuts.length && filteredCuts.length > 0 && (
            <CheckCircle className="h-4 w-4 text-primary-foreground" />
          )}
        </button>
        <span className="text-sm text-muted-foreground">
          Selecionar todos ({filteredCuts.length})
        </span>
      </div>

      {/* Cuts Grid/List */}
      {viewMode === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCuts.map((cut) => (
            <CutCard
              key={cut.id}
              cut={cut}
              isSelected={selectedCuts.includes(cut.id)}
              onSelect={() => toggleCutSelection(cut.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {filteredCuts.map((cut) => (
            <CutListItem
              key={cut.id}
              cut={cut}
              isSelected={selectedCuts.includes(cut.id)}
              onSelect={() => toggleCutSelection(cut.id)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function CutCard({
  cut,
  isSelected,
  onSelect,
}: {
  cut: Cut
  isSelected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[cut.status]
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all",
        isSelected ? "border-primary" : "border-border hover:border-primary/50"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onSelect}
        className={cn(
          "absolute left-3 top-3 z-10 h-5 w-5 rounded border transition-all",
          isSelected
            ? "border-primary bg-primary"
            : "border-white/50 bg-black/30 opacity-0 group-hover:opacity-100"
        )}
      >
        {isSelected && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
      </button>

      {/* Thumbnail - 9:16 aspect ratio */}
      <div className="relative aspect-[9/16] overflow-hidden">
        <img
          src={cut.thumbnail}
          alt={cut.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <Button
          size="icon"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Play className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {cut.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium text-card-foreground">
            {cut.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Play className="h-4 w-4" /> Reproduzir
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Edit3 className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Calendar className="h-4 w-4" /> Agendar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Share2 className="h-4 w-4" /> Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Download className="h-4 w-4" /> Baixar
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">{cut.originalVideo}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          {cut.views && (
            <span className="text-xs text-muted-foreground">
              {cut.views.toLocaleString()} views
            </span>
          )}
          {cut.scheduledFor && (
            <span className="text-xs text-muted-foreground">{cut.scheduledFor}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CutListItem({
  cut,
  isSelected,
  onSelect,
}: {
  cut: Cut
  isSelected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[cut.status]
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-3 transition-all",
        isSelected ? "border-primary" : "border-border hover:border-primary/50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onSelect}
        className={cn(
          "h-5 w-5 shrink-0 rounded border transition-colors",
          isSelected
            ? "border-primary bg-primary"
            : "border-border bg-secondary hover:border-primary/50"
        )}
      >
        {isSelected && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
      </button>

      {/* Thumbnail */}
      <div className="relative h-16 w-9 shrink-0 overflow-hidden rounded-lg">
        <img
          src={cut.thumbnail}
          alt={cut.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
          {cut.duration}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-card-foreground">
          {cut.title}
        </h3>
        <p className="text-xs text-muted-foreground">{cut.originalVideo}</p>
      </div>

      {/* Status */}
      <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </span>

      {/* Stats */}
      <div className="w-24 text-right">
        {cut.views && (
          <span className="text-sm text-foreground">{cut.views.toLocaleString()}</span>
        )}
        {cut.scheduledFor && (
          <span className="text-sm text-foreground">{cut.scheduledFor}</span>
        )}
        {!cut.views && !cut.scheduledFor && (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Play className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Calendar className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Edit3 className="h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Share2 className="h-4 w-4" /> Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
