"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Upload,
  Link2,
  Youtube,
  Loader2,
  CheckCircle,
  Sparkles,
  Settings2,
  Video,
  Scissors,
} from "lucide-react"
import { cn } from "@/lib/utils"

type UploadMethod = "file" | "youtube"
type ProcessingStatus = "idle" | "uploading" | "analyzing" | "generating" | "completed"

const processingSteps = [
  { id: "uploading", label: "Enviando vídeo", icon: Upload },
  { id: "analyzing", label: "Analisando conteúdo com IA", icon: Sparkles },
  { id: "generating", label: "Gerando cortes", icon: Scissors },
  { id: "completed", label: "Concluído", icon: CheckCircle },
]

export default function UploadPage() {
  const [method, setMethod] = useState<UploadMethod>("file")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<ProcessingStatus>("idle")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // AI Settings
  const [cutsCount, setCutsCount] = useState(5)
  const [minDuration, setMinDuration] = useState(15)
  const [maxDuration, setMaxDuration] = useState(60)
  const [detectHighlights, setDetectHighlights] = useState(true)
  const [addCaptions, setAddCaptions] = useState(true)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const simulateProcessing = async () => {
    setStatus("uploading")
    await new Promise((r) => setTimeout(r, 2000))
    setStatus("analyzing")
    await new Promise((r) => setTimeout(r, 3000))
    setStatus("generating")
    await new Promise((r) => setTimeout(r, 3000))
    setStatus("completed")
  }

  const handleSubmit = () => {
    if ((method === "file" && uploadedFile) || (method === "youtube" && youtubeUrl)) {
      simulateProcessing()
    }
  }

  const getCurrentStepIndex = () => {
    return processingSteps.findIndex((step) => step.id === status)
  }

  return (
    <DashboardLayout
      title="Upload de Vídeo"
      description="Envie um vídeo ou cole uma URL do YouTube para gerar cortes automáticos"
    >
      <div className="mx-auto max-w-4xl">
        {status === "idle" ? (
          <>
            {/* Upload Method Selection */}
            <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setMethod("file")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  method === "file"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload de Arquivo
              </button>
              <button
                onClick={() => setMethod("youtube")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  method === "youtube"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Youtube className="h-4 w-4" />
                URL do YouTube
              </button>
            </div>

            {/* Upload Area */}
            <div className="mt-6">
              {method === "file" ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-12 transition-all",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    uploadedFile && "border-primary bg-primary/5"
                  )}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {uploadedFile ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <Video className="h-8 w-8 text-primary" />
                      </div>
                      <p className="mt-4 text-lg font-medium text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedFile(null)
                        }}
                      >
                        Trocar Arquivo
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-lg font-medium text-foreground">
                        Arraste seu vídeo aqui
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ou clique para selecionar um arquivo
                      </p>
                      <p className="mt-4 text-xs text-muted-foreground">
                        MP4, MOV, AVI, MKV até 2GB
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-6">
                  <label className="text-sm font-medium text-foreground">
                    URL do YouTube
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="h-11 w-full rounded-lg border border-input bg-secondary pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cole a URL completa do vídeo que deseja processar
                  </p>
                </div>
              )}
            </div>

            {/* AI Settings */}
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Configurações da IA
                </h3>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* Cuts Count */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Quantidade de Cortes
                  </label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={cutsCount}
                      onChange={(e) => setCutsCount(Number(e.target.value))}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                    />
                    <span className="w-8 text-center text-sm font-medium text-foreground">
                      {cutsCount}
                    </span>
                  </div>
                </div>

                {/* Duration Range */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Duração dos Cortes (seg)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={minDuration}
                      onChange={(e) => setMinDuration(Number(e.target.value))}
                      className="h-10 w-20 rounded-lg border border-input bg-secondary px-3 text-center text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    <span className="text-muted-foreground">até</span>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(Number(e.target.value))}
                      className="h-10 w-20 rounded-lg border border-input bg-secondary px-3 text-center text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Toggle: Detect Highlights */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Detectar Momentos Virais
                    </p>
                    <p className="text-xs text-muted-foreground">
                      A IA identifica os melhores trechos automaticamente
                    </p>
                  </div>
                  <button
                    onClick={() => setDetectHighlights(!detectHighlights)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      detectHighlights ? "bg-primary" : "bg-secondary"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                        detectHighlights ? "left-5.5" : "left-0.5"
                      )}
                    />
                  </button>
                </div>

                {/* Toggle: Add Captions */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Adicionar Legendas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gera legendas automáticas nos cortes
                    </p>
                  </div>
                  <button
                    onClick={() => setAddCaptions(!addCaptions)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      addCaptions ? "bg-primary" : "bg-secondary"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                        addCaptions ? "left-5.5" : "left-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <Button
                size="lg"
                className="gap-2"
                onClick={handleSubmit}
                disabled={
                  (method === "file" && !uploadedFile) ||
                  (method === "youtube" && !youtubeUrl)
                }
              >
                <Sparkles className="h-5 w-5" />
                Processar com IA
              </Button>
            </div>
          </>
        ) : (
          /* Processing State */
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="flex flex-col items-center text-center">
              {status === "completed" ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}

              <h2 className="mt-6 text-2xl font-bold text-foreground">
                {status === "completed"
                  ? "Processamento Concluído!"
                  : "Processando seu vídeo..."}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {status === "completed"
                  ? "Seus cortes estão prontos para visualização"
                  : "Isso pode levar alguns minutos dependendo da duração do vídeo"}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mx-auto mt-8 max-w-md">
              {processingSteps.map((step, index) => {
                const currentIndex = getCurrentStepIndex()
                const isCompleted = index < currentIndex
                const isCurrent = index === currentIndex
                const Icon = step.icon

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                          isCompleted || isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isCurrent && status !== "completed" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      {index < processingSteps.length - 1 && (
                        <div
                          className={cn(
                            "h-12 w-0.5 transition-all",
                            isCompleted ? "bg-primary" : "bg-secondary"
                          )}
                        />
                      )}
                    </div>
                    <div className="pb-12">
                      <p
                        className={cn(
                          "font-medium",
                          isCompleted || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </p>
                      {isCurrent && status !== "completed" && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Em andamento...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {status === "completed" && (
              <div className="mt-8 flex justify-center gap-4">
                <Button variant="outline" onClick={() => setStatus("idle")}>
                  Novo Upload
                </Button>
                <Button className="gap-2">
                  <Scissors className="h-4 w-4" />
                  Ver Cortes Gerados
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
