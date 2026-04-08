import { createClient } from '@/lib/supabase/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const VideoAnalysisSchema = z.object({
  title: z.string().describe('Título sugerido para o vídeo'),
  description: z.string().describe('Descrição do conteúdo do vídeo'),
  duration: z.number().describe('Duração estimada em segundos'),
  mainTopics: z.array(z.string()).describe('Principais tópicos abordados'),
  suggestedClips: z.array(z.object({
    title: z.string().describe('Título do corte'),
    startTime: z.number().describe('Tempo de início em segundos'),
    endTime: z.number().describe('Tempo de fim em segundos'),
    hookScore: z.number().min(0).max(100).describe('Pontuação do gancho (0-100)'),
    engagementPotential: z.number().min(0).max(100).describe('Potencial de engajamento (0-100)'),
    viralProbability: z.number().min(0).max(100).describe('Probabilidade viral (0-100)'),
    suggestedCaption: z.string().describe('Legenda sugerida'),
    suggestedHashtags: z.array(z.string()).describe('Hashtags sugeridas'),
    bestPlatforms: z.array(z.enum(['youtube', 'tiktok', 'instagram', 'kwai', 'facebook', 'twitter'])).describe('Melhores plataformas para postar'),
    highlights: z.array(z.string()).describe('Destaques do corte'),
  })).describe('Cortes sugeridos pela IA'),
  thumbnailSuggestion: z.string().describe('Sugestão para thumbnail'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { url, title, settings } = body
    
    if (!url) {
      return NextResponse.json({ error: 'URL do vídeo é obrigatória' }, { status: 400 })
    }
    
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })
    }
    
    // Create video record
    const { data: video, error: createError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: title || `Vídeo ${videoId}`,
        source_url: url,
        status: 'processing',
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      })
      .select()
      .single()
    
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
    
    // Use AI to analyze the video
    const maxClips = settings?.maxClips || 5
    const minDuration = settings?.minDuration || 15
    const maxDuration = settings?.maxDuration || 60
    
    const { output } = await generateText({
      model: 'openai/gpt-5-mini',
      output: Output.object({ schema: VideoAnalysisSchema }),
      prompt: `Analise este vídeo do YouTube e sugira os melhores cortes para redes sociais.

URL do vídeo: ${url}
ID do vídeo: ${videoId}

Configurações:
- Máximo de cortes: ${maxClips}
- Duração mínima do corte: ${minDuration} segundos
- Duração máxima do corte: ${maxDuration} segundos
- Gerar legendas: ${settings?.generateCaptions ? 'Sim' : 'Não'}

Baseado no título e thumbnail do vídeo (https://img.youtube.com/vi/${videoId}/maxresdefault.jpg), analise e sugira:

1. Um título otimizado para o vídeo
2. Uma descrição do conteúdo
3. Os principais tópicos abordados
4. Cortes sugeridos com:
   - Momentos de maior engajamento
   - Ganchos fortes no início
   - Potencial viral
   - Legendas e hashtags otimizadas para cada plataforma
5. Sugestão para thumbnail

Foque em criar cortes que funcionem bem em formato vertical (9:16) para TikTok, Instagram Reels, YouTube Shorts e Kwai.
Priorize momentos com:
- Reações emocionais
- Frases de impacto
- Momentos engraçados ou surpreendentes
- Informações valiosas em formato rápido
- Ganchos que prendam a atenção nos primeiros 3 segundos`,
    })
    
    if (!output) {
      await supabase
        .from('videos')
        .update({ status: 'failed' })
        .eq('id', video.id)
      
      return NextResponse.json({ error: 'Falha na análise do vídeo' }, { status: 500 })
    }
    
    // Update video with analysis
    await supabase
      .from('videos')
      .update({
        title: output.title || video.title,
        description: output.description,
        duration: output.duration,
        status: 'completed',
        metadata: {
          mainTopics: output.mainTopics,
          thumbnailSuggestion: output.thumbnailSuggestion,
          analyzedAt: new Date().toISOString(),
        },
      })
      .eq('id', video.id)
    
    // Create clips from suggestions
    const clips = []
    for (const suggestion of output.suggestedClips) {
      const { data: clip } = await supabase
        .from('clips')
        .insert({
          video_id: video.id,
          user_id: user.id,
          title: suggestion.title,
          start_time: suggestion.startTime,
          end_time: suggestion.endTime,
          duration: suggestion.endTime - suggestion.startTime,
          status: 'ready',
          ai_score: Math.round((suggestion.hookScore + suggestion.engagementPotential + suggestion.viralProbability) / 3),
          ai_analysis: {
            hook_score: suggestion.hookScore,
            engagement_potential: suggestion.engagementPotential,
            viral_probability: suggestion.viralProbability,
            suggested_hashtags: suggestion.suggestedHashtags,
            suggested_caption: suggestion.suggestedCaption,
            best_platforms: suggestion.bestPlatforms,
            highlights: suggestion.highlights,
            transcript_snippet: '',
          },
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        })
        .select()
        .single()
      
      if (clip) {
        clips.push(clip)
      }
    }
    
    return NextResponse.json({
      success: true,
      video: {
        ...video,
        title: output.title,
        description: output.description,
        duration: output.duration,
      },
      clips,
      analysis: output,
      message: `Vídeo analisado com sucesso! ${clips.length} cortes gerados.`,
    })
    
  } catch (error) {
    console.error('Error analyzing video:', error)
    return NextResponse.json(
      { error: 'Erro interno ao analisar vídeo' },
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
