import { createClient } from '@/lib/supabase/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const OptimizationSchema = z.object({
  optimizedCaption: z.string().describe('Legenda otimizada para a plataforma'),
  optimizedHashtags: z.array(z.string()).describe('Hashtags otimizadas'),
  bestPostingTime: z.string().describe('Melhor horário para postar'),
  trendingTopics: z.array(z.string()).describe('Tópicos em alta relacionados'),
  callToAction: z.string().describe('Call to action sugerido'),
  hookSuggestion: z.string().describe('Sugestão para melhorar o gancho'),
  estimatedReach: z.number().describe('Alcance estimado'),
  estimatedEngagement: z.number().describe('Engajamento estimado em porcentagem'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { clipId, platform, targetAudience } = body
    
    if (!clipId || !platform) {
      return NextResponse.json({ error: 'ID do corte e plataforma são obrigatórios' }, { status: 400 })
    }
    
    // Get clip with video info
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .select(`
        *,
        video:videos(title, description)
      `)
      .eq('id', clipId)
      .eq('user_id', user.id)
      .single()
    
    if (clipError || !clip) {
      return NextResponse.json({ error: 'Corte não encontrado' }, { status: 404 })
    }
    
    const platformNames: Record<string, string> = {
      youtube: 'YouTube Shorts',
      tiktok: 'TikTok',
      instagram: 'Instagram Reels',
      kwai: 'Kwai',
      facebook: 'Facebook Reels',
      twitter: 'X (Twitter)',
    }
    
    const { output } = await generateText({
      model: 'openai/gpt-5-mini',
      output: Output.object({ schema: OptimizationSchema }),
      prompt: `Otimize este corte de vídeo para ${platformNames[platform] || platform}.

Informações do corte:
- Título: ${clip.title}
- Descrição: ${clip.description || 'N/A'}
- Duração: ${clip.duration} segundos
- Vídeo original: ${clip.video?.title || 'N/A'}
- Análise atual: ${JSON.stringify(clip.ai_analysis || {})}

Público-alvo: ${targetAudience || 'Geral, 18-35 anos, interessado em conteúdo viral'}

Plataforma: ${platformNames[platform] || platform}

Forneça:
1. Legenda otimizada para ${platformNames[platform]} (com emojis apropriados)
2. Hashtags específicas para a plataforma (máx 10)
3. Melhor horário para postar no Brasil
4. Tópicos em alta que podem ser incorporados
5. Call to action efetivo
6. Sugestão para melhorar o gancho inicial
7. Estimativa de alcance baseado em conteúdo similar
8. Estimativa de taxa de engajamento

Considere as especificidades de ${platformNames[platform]}:
- Limite de caracteres
- Hashtags mais populares
- Tom de voz da plataforma
- Formato preferido de conteúdo
- Horários de maior engajamento`,
    })
    
    if (!output) {
      return NextResponse.json({ error: 'Falha na otimização' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      optimization: output,
      platform,
      clipId,
      message: `Corte otimizado para ${platformNames[platform]}!`,
    })
    
  } catch (error) {
    console.error('Error optimizing clip:', error)
    return NextResponse.json(
      { error: 'Erro interno ao otimizar corte' },
      { status: 500 }
    )
  }
}
