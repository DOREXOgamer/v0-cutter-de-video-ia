import { createClient } from '@/lib/supabase/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const ClipGenerationSchema = z.object({
  clips: z.array(z.object({
    title: z.string(),
    description: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    hookScore: z.number().min(0).max(100),
    engagementPotential: z.number().min(0).max(100),
    viralProbability: z.number().min(0).max(100),
    suggestedCaption: z.string(),
    suggestedHashtags: z.array(z.string()),
    bestPlatforms: z.array(z.enum(['youtube', 'tiktok', 'instagram', 'kwai', 'facebook', 'twitter'])),
    highlights: z.array(z.string()),
    transcriptSnippet: z.string(),
  })),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { videoId, count = 5, minDuration = 15, maxDuration = 60 } = body
    
    if (!videoId) {
      return NextResponse.json({ error: 'ID do vídeo é obrigatório' }, { status: 400 })
    }
    
    // Get video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()
    
    if (videoError || !video) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })
    }
    
    // Extract video ID from URL
    const ytVideoId = extractYouTubeId(video.source_url)
    
    // Generate more clips with AI
    const { output } = await generateText({
      model: 'openai/gpt-5-mini',
      output: Output.object({ schema: ClipGenerationSchema }),
      prompt: `Gere ${count} novos cortes para o vídeo "${video.title}".

URL: ${video.source_url}
Duração total: ${video.duration || 'desconhecida'} segundos
Descrição: ${video.description || 'Não disponível'}

Requisitos:
- Duração mínima: ${minDuration} segundos
- Duração máxima: ${maxDuration} segundos
- Formato: vertical (9:16) para shorts
- Cada corte deve ter um gancho forte nos primeiros 3 segundos

Para cada corte, forneça:
1. Título atrativo
2. Descrição breve
3. Tempo de início e fim
4. Pontuação de gancho (hook_score)
5. Potencial de engajamento
6. Probabilidade viral
7. Legenda otimizada
8. Hashtags relevantes
9. Melhores plataformas
10. Destaques principais
11. Trecho da transcrição

Priorize momentos únicos que não foram cortados antes e que tenham alto potencial viral.`,
    })
    
    if (!output) {
      return NextResponse.json({ error: 'Falha na geração de cortes' }, { status: 500 })
    }
    
    // Save clips
    const createdClips = []
    for (const clipData of output.clips) {
      const { data: clip, error } = await supabase
        .from('clips')
        .insert({
          video_id: videoId,
          user_id: user.id,
          title: clipData.title,
          description: clipData.description,
          start_time: clipData.startTime,
          end_time: clipData.endTime,
          duration: clipData.endTime - clipData.startTime,
          status: 'ready',
          ai_score: Math.round((clipData.hookScore + clipData.engagementPotential + clipData.viralProbability) / 3),
          ai_analysis: {
            hook_score: clipData.hookScore,
            engagement_potential: clipData.engagementPotential,
            viral_probability: clipData.viralProbability,
            suggested_hashtags: clipData.suggestedHashtags,
            suggested_caption: clipData.suggestedCaption,
            best_platforms: clipData.bestPlatforms,
            highlights: clipData.highlights,
            transcript_snippet: clipData.transcriptSnippet,
          },
          thumbnail_url: ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg` : null,
        })
        .select()
        .single()
      
      if (clip) {
        createdClips.push(clip)
      }
    }
    
    return NextResponse.json({
      success: true,
      clips: createdClips,
      message: `${createdClips.length} cortes gerados com sucesso!`,
    })
    
  } catch (error) {
    console.error('Error generating clips:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar cortes' },
      { status: 500 }
    )
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}
