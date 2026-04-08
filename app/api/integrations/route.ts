import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Platform } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Hide sensitive tokens
    const safeData = data.map(integration => ({
      ...integration,
      access_token: integration.access_token ? '***' : null,
      refresh_token: integration.refresh_token ? '***' : null,
    }))
    
    return NextResponse.json({ integrations: safeData })
    
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar integrações' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { platform, simulate = true } = body
    
    if (!platform) {
      return NextResponse.json({ error: 'Plataforma é obrigatória' }, { status: 400 })
    }
    
    const validPlatforms: Platform[] = ['youtube', 'tiktok', 'instagram', 'kwai', 'facebook', 'twitter']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
    }
    
    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()
    
    if (existing) {
      // Reactivate existing integration
      const simulatedData = getSimulatedPlatformData(platform)
      
      const { data, error } = await supabase
        .from('integrations')
        .update({
          is_active: true,
          access_token: `simulated_${Date.now()}`,
          refresh_token: `refresh_${Date.now()}`,
          platform_user_id: simulatedData.userId,
          platform_username: simulatedData.username,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { 
            simulated: simulate,
            reconnectedAt: new Date().toISOString(),
            followers: simulatedData.followers,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        integration: {
          ...data,
          access_token: '***',
          refresh_token: '***',
        },
        message: `Reconectado ao ${platform} com sucesso!`,
      })
    }
    
    // Create new integration
    const simulatedData = getSimulatedPlatformData(platform)
    
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        platform,
        is_active: true,
        access_token: `simulated_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        platform_user_id: simulatedData.userId,
        platform_username: simulatedData.username,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { 
          simulated: simulate,
          connectedAt: new Date().toISOString(),
          followers: simulatedData.followers,
        },
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      integration: {
        ...data,
        access_token: '***',
        refresh_token: '***',
      },
      message: `Conectado ao ${platform} com sucesso!`,
    })
    
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar integração' },
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
    const integrationId = searchParams.get('id')
    const platform = searchParams.get('platform')
    
    if (!integrationId && !platform) {
      return NextResponse.json({ error: 'ID ou plataforma é obrigatório' }, { status: 400 })
    }
    
    let query = supabase
      .from('integrations')
      .update({ 
        is_active: false,
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    
    if (integrationId) {
      query = query.eq('id', integrationId)
    } else if (platform) {
      query = query.eq('platform', platform)
    }
    
    const { error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Integração desconectada com sucesso' 
    })
    
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    return NextResponse.json(
      { error: 'Erro interno ao desconectar integração' },
      { status: 500 }
    )
  }
}

function getSimulatedPlatformData(platform: Platform): { 
  username: string
  userId: string
  followers: number 
} {
  const data: Record<Platform, { username: string; userId: string; followers: number }> = {
    youtube: { 
      username: '@MeuCanal', 
      userId: 'UC' + Math.random().toString(36).substring(2, 12),
      followers: Math.floor(Math.random() * 100000) + 1000,
    },
    tiktok: { 
      username: '@meutiktok', 
      userId: Math.random().toString().substring(2, 12),
      followers: Math.floor(Math.random() * 500000) + 5000,
    },
    instagram: { 
      username: '@meuinsta', 
      userId: Math.random().toString().substring(2, 12),
      followers: Math.floor(Math.random() * 200000) + 2000,
    },
    kwai: { 
      username: '@meukwai', 
      userId: 'kwai_' + Math.random().toString(36).substring(2, 8),
      followers: Math.floor(Math.random() * 50000) + 500,
    },
    facebook: { 
      username: 'Minha Página', 
      userId: 'fb_' + Math.random().toString(36).substring(2, 8),
      followers: Math.floor(Math.random() * 80000) + 1000,
    },
    twitter: { 
      username: '@meutwitter', 
      userId: 'tw_' + Math.random().toString(36).substring(2, 8),
      followers: Math.floor(Math.random() * 30000) + 500,
    },
  }
  
  return data[platform]
}
