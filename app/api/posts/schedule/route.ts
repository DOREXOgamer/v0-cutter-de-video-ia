import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Platform } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { clipId, platforms, scheduledFor, caption, hashtags } = body
    
    if (!clipId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'ID do corte e plataformas são obrigatórios' }, { status: 400 })
    }
    
    if (!scheduledFor) {
      return NextResponse.json({ error: 'Data de agendamento é obrigatória' }, { status: 400 })
    }
    
    // Verify clip exists
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .select('id, title, status')
      .eq('id', clipId)
      .eq('user_id', user.id)
      .single()
    
    if (clipError || !clip) {
      return NextResponse.json({ error: 'Corte não encontrado' }, { status: 404 })
    }
    
    // Get active integrations for the selected platforms
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('id, platform')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('platform', platforms)
    
    if (integrationsError) {
      return NextResponse.json({ error: 'Erro ao buscar integrações' }, { status: 500 })
    }
    
    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma integração ativa encontrada para as plataformas selecionadas' 
      }, { status: 400 })
    }
    
    // Create scheduled posts for each platform
    const scheduledPosts = []
    const errors = []
    
    for (const integration of integrations) {
      const { data: post, error: postError } = await supabase
        .from('scheduled_posts')
        .insert({
          clip_id: clipId,
          user_id: user.id,
          integration_id: integration.id,
          platform: integration.platform as Platform,
          scheduled_for: scheduledFor,
          caption: caption || null,
          hashtags: hashtags || null,
          status: 'scheduled',
        })
        .select()
        .single()
      
      if (postError) {
        errors.push(`${integration.platform}: ${postError.message}`)
      } else if (post) {
        scheduledPosts.push(post)
      }
    }
    
    if (scheduledPosts.length === 0) {
      return NextResponse.json({ 
        error: 'Falha ao agendar posts', 
        details: errors 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      posts: scheduledPosts,
      errors: errors.length > 0 ? errors : undefined,
      message: `${scheduledPosts.length} post(s) agendado(s) com sucesso!`,
    })
    
  } catch (error) {
    console.error('Error scheduling posts:', error)
    return NextResponse.json(
      { error: 'Erro interno ao agendar posts' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    let query = supabase
      .from('scheduled_posts')
      .select(`
        *,
        clip:clips(id, title, thumbnail_url, duration, ai_analysis),
        integration:integrations(id, platform, platform_username)
      `)
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })
    
    if (status) {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }
    if (from) {
      query = query.gte('scheduled_for', from)
    }
    if (to) {
      query = query.lte('scheduled_for', to)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ posts: data })
    
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar posts agendados' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')
    
    if (!postId) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Post removido com sucesso' })
    
  } catch (error) {
    console.error('Error deleting scheduled post:', error)
    return NextResponse.json(
      { error: 'Erro interno ao remover post' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { postId, scheduledFor, caption, hashtags, status } = body
    
    if (!postId) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 })
    }
    
    const updateData: Record<string, unknown> = {}
    if (scheduledFor) updateData.scheduled_for = scheduledFor
    if (caption !== undefined) updateData.caption = caption
    if (hashtags !== undefined) updateData.hashtags = hashtags
    if (status) updateData.status = status
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      post: data,
      message: 'Post atualizado com sucesso' 
    })
    
  } catch (error) {
    console.error('Error updating scheduled post:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar post' },
      { status: 500 }
    )
  }
}
