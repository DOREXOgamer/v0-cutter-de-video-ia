"use client"

import { Play, MoreVertical, Clock, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  cuts: number
  status: "processing" | "completed" | "failed"
  createdAt: string
}

const statusConfig = {
  processing: {
    label: "Processando",
    color: "bg-yellow-500/20 text-yellow-400",
  },
  completed: {
    label: "Concluído",
    color: "bg-primary/20 text-primary",
  },
  failed: {
    label: "Erro",
    color: "bg-destructive/20 text-destructive",
  },
}

export function VideoCard({
  title,
  thumbnail,
  duration,
  cuts,
  status,
  createdAt,
}: VideoCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <Button
          size="icon"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Play className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
          <Clock className="h-3 w-3" />
          {duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium text-card-foreground">
            {title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver Cortes</DropdownMenuItem>
              <DropdownMenuItem>Reprocessar</DropdownMenuItem>
              <DropdownMenuItem>Baixar Original</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                statusInfo.color
              )}
            >
              {statusInfo.label}
            </span>
            {status === "completed" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Scissors className="h-3 w-3" />
                {cuts} cortes
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{createdAt}</span>
        </div>
      </div>
    </div>
  )
}
