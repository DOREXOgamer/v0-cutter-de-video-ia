'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ScheduledPost, Platform, PostStatus } from '@/lib/types'

export async function getScheduledPosts(options?: {
  status?: PostStatus
  platform?: Platform
  from?: string
  to?: string
}): Promise<ScheduledPost[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  let query = supabase
    .from('scheduled_posts')
    .select(`
      *,
      clip:clips(id, title, thumbnail_url, duration, video:videos(title)),
      integration:integrations(id, platform, platform_username)
    `)
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true })
  
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.platform) {
    query = query.eq('platform', options.platform)
  }
  if (options?.from) {
    query = query.gte('scheduled_for', options.from)
  }
  if (options?.to) {
    query = query.lte('scheduled_for', options.to)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching scheduled posts:', error)
    return []
  }
  
  return data as ScheduledPost[]
}

export async function getScheduledPost(id: string): Promise<ScheduledPost | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select(`
      *,
      clip:clips(id, title, thumbnail_url, duration),
      integration:integrations(id, platform, platform_username)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching scheduled post:', error)
    return null
  }
  
  return data as ScheduledPost
}

export async function createScheduledPost(input: {
  clipId: string
  integrationId: string
  platform: Platform
  scheduledFor: string
  caption?: string
  hashtags?: string[]
}): Promise<{ post: ScheduledPost | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { post: null, error: 'Usuário não autenticado' }
  }
  
  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      clip_id: input.clipId,
      user_id: user.id,
      integration_id: input.integrationId,
      platform: input.platform,
      scheduled_for: input.scheduledFor,
      caption: input.caption || null,
      hashtags: input.hashtags || null,
      status: 'scheduled' as PostStatus,
    })
    .select(`
      *,
      clip:clips(id, title, thumbnail_url, duration),
      integration:integrations(id, platform, platform_username)
    `)
    .single()
  
  if (error) {
    console.error('Error creating scheduled post:', error)
    return { post: null, error: error.message }
  }
  
  revalidatePath('/agendar')
  revalidatePath('/')
  
  return { post: data as ScheduledPost, error: null }
}

export async function createMultipleScheduledPosts(input: {
  clipId: string
  platforms: { integrationId: string; platform: Platform }[]
  scheduledFor: string
  caption?: string
  hashtags?: string[]
}): Promise<{ posts: ScheduledPost[]; errors: string[] }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { posts: [], errors: ['Usuário não autenticado'] }
  }
  
  const posts: ScheduledPost[] = []
  const errors: string[] = []
  
  for (const platformInfo of input.platforms) {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        clip_id: input.clipId,
        user_id: user.id,
        integration_id: platformInfo.integrationId,
        platform: platformInfo.platform,
        scheduled_for: input.scheduledFor,
        caption: input.caption || null,
        hashtags: input.hashtags || null,
        status: 'scheduled' as PostStatus,
      })
      .select()
      .single()
    
    if (error) {
      errors.push(`${platformInfo.platform}: ${error.message}`)
    } else if (data) {
      posts.push(data as ScheduledPost)
    }
  }
  
  revalidatePath('/agendar')
  revalidatePath('/')
  
  return { posts, errors }
}

export async function updateScheduledPost(
  id: string,
  updates: {
    scheduledFor?: string
    caption?: string
    hashtags?: string[]
    status?: PostStatus
  }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const updateData: Record<string, unknown> = {}
  if (updates.scheduledFor) updateData.scheduled_for = updates.scheduledFor
  if (updates.caption !== undefined) updateData.caption = updates.caption
  if (updates.hashtags !== undefined) updateData.hashtags = updates.hashtags
  if (updates.status) updateData.status = updates.status
  
  const { error } = await supabase
    .from('scheduled_posts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating scheduled post:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/agendar')
  revalidatePath('/')
  
  return { success: true, error: null }
}

export async function cancelScheduledPost(id: string): Promise<{ success: boolean; error: string | null }> {
  return updateScheduledPost(id, { status: 'cancelled' })
}

export async function deleteScheduledPost(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting scheduled post:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/agendar')
  revalidatePath('/')
  
  return { success: true, error: null }
}

export async function getScheduledPostStats(): Promise<{
  total: number
  scheduled: number
  published: number
  failed: number
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total: 0, scheduled: 0, published: 0, failed: 0 }
  }
  
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('status')
    .eq('user_id', user.id)
  
  if (error || !data) {
    return { total: 0, scheduled: 0, published: 0, failed: 0 }
  }
  
  return {
    total: data.length,
    scheduled: data.filter(p => p.status === 'scheduled').length,
    published: data.filter(p => p.status === 'published').length,
    failed: data.filter(p => p.status === 'failed').length,
  }
}

export async function getUpcomingPosts(limit: number = 5): Promise<ScheduledPost[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select(`
      *,
      clip:clips(id, title, thumbnail_url, duration)
    `)
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching upcoming posts:', error)
    return []
  }
  
  return data as ScheduledPost[]
}
