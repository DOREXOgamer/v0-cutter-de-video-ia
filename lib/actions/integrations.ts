'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Integration, Platform } from '@/lib/types'

export async function getIntegrations(): Promise<Integration[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching integrations:', error)
    return []
  }
  
  return data as Integration[]
}

export async function getIntegration(id: string): Promise<Integration | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching integration:', error)
    return null
  }
  
  return data as Integration
}

export async function getIntegrationByPlatform(platform: Platform): Promise<Integration | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('is_active', true)
    .single()
  
  if (error) {
    console.error('Error fetching integration:', error)
    return null
  }
  
  return data as Integration
}

export async function createIntegration(input: {
  platform: Platform
  accessToken?: string
  refreshToken?: string
  platformUserId?: string
  platformUsername?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}): Promise<{ integration: Integration | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { integration: null, error: 'Usuário não autenticado' }
  }
  
  // Check if integration already exists
  const existing = await getIntegrationByPlatform(input.platform)
  if (existing) {
    // Update existing integration
    const { data, error } = await supabase
      .from('integrations')
      .update({
        access_token: input.accessToken || existing.access_token,
        refresh_token: input.refreshToken || existing.refresh_token,
        platform_user_id: input.platformUserId || existing.platform_user_id,
        platform_username: input.platformUsername || existing.platform_username,
        expires_at: input.expiresAt || existing.expires_at,
        metadata: input.metadata || existing.metadata,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      return { integration: null, error: error.message }
    }
    
    revalidatePath('/integracoes')
    return { integration: data as Integration, error: null }
  }
  
  const { data, error } = await supabase
    .from('integrations')
    .insert({
      user_id: user.id,
      platform: input.platform,
      access_token: input.accessToken || null,
      refresh_token: input.refreshToken || null,
      platform_user_id: input.platformUserId || null,
      platform_username: input.platformUsername || null,
      is_active: true,
      expires_at: input.expiresAt || null,
      metadata: input.metadata || null,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating integration:', error)
    return { integration: null, error: error.message }
  }
  
  revalidatePath('/integracoes')
  
  return { integration: data as Integration, error: null }
}

export async function updateIntegration(
  id: string,
  updates: {
    accessToken?: string
    refreshToken?: string
    platformUsername?: string
    isActive?: boolean
    expiresAt?: string
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.accessToken !== undefined) updateData.access_token = updates.accessToken
  if (updates.refreshToken !== undefined) updateData.refresh_token = updates.refreshToken
  if (updates.platformUsername !== undefined) updateData.platform_username = updates.platformUsername
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata
  
  const { error } = await supabase
    .from('integrations')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating integration:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/integracoes')
  
  return { success: true, error: null }
}

export async function disconnectIntegration(id: string): Promise<{ success: boolean; error: string | null }> {
  return updateIntegration(id, { isActive: false, accessToken: undefined, refreshToken: undefined })
}

export async function deleteIntegration(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting integration:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/integracoes')
  
  return { success: true, error: null }
}

export async function getActiveIntegrations(): Promise<Integration[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching active integrations:', error)
    return []
  }
  
  return data as Integration[]
}

// Simulated OAuth connection - in production, this would redirect to the platform's OAuth
export async function simulateConnect(platform: Platform): Promise<{ integration: Integration | null; error: string | null }> {
  // Generate simulated data
  const platformData: Record<Platform, { username: string; userId: string }> = {
    youtube: { username: '@MeuCanal', userId: 'UC123456' },
    tiktok: { username: '@meutiktok', userId: '123456789' },
    instagram: { username: '@meuinsta', userId: '987654321' },
    kwai: { username: '@meukwai', userId: 'kwai123' },
    facebook: { username: 'Minha Página', userId: 'fb123' },
    twitter: { username: '@meutwitter', userId: 'tw456' },
  }
  
  const data = platformData[platform]
  
  return createIntegration({
    platform,
    platformUserId: data.userId,
    platformUsername: data.username,
    accessToken: `simulated_token_${Date.now()}`,
    refreshToken: `simulated_refresh_${Date.now()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    metadata: { simulated: true, connectedAt: new Date().toISOString() },
  })
}
