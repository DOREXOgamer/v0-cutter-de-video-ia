'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Clip, ClipStatus, AIAnalysis } from '@/lib/types'

export async function getClips(videoId?: string): Promise<Clip[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  let query = supabase
    .from('clips')
    .select(`
      *,
      video:videos(id, title, thumbnail_url, source_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (videoId) {
    query = query.eq('video_id', videoId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching clips:', error)
    return []
  }
  
  return data as Clip[]
}

export async function getClip(id: string): Promise<Clip | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('clips')
    .select(`
      *,
      video:videos(id, title, thumbnail_url, source_url)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching clip:', error)
    return null
  }
  
  return data as Clip
}

export async function createClip(input: {
  videoId: string
  title: string
  startTime: number
  endTime: number
  description?: string
  aiAnalysis?: AIAnalysis
  aiScore?: number
}): Promise<{ clip: Clip | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { clip: null, error: 'Usuário não autenticado' }
  }
  
  const duration = input.endTime - input.startTime
  
  const { data, error } = await supabase
    .from('clips')
    .insert({
      video_id: input.videoId,
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      start_time: input.startTime,
      end_time: input.endTime,
      duration,
      status: 'pending' as ClipStatus,
      ai_score: input.aiScore || null,
      ai_analysis: input.aiAnalysis || null,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating clip:', error)
    return { clip: null, error: error.message }
  }
  
  revalidatePath('/cortes')
  revalidatePath('/')
  
  return { clip: data as Clip, error: null }
}

export async function updateClipStatus(
  id: string,
  status: ClipStatus,
  clipUrl?: string,
  thumbnailUrl?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const updateData: Record<string, unknown> = { status }
  if (clipUrl) updateData.clip_url = clipUrl
  if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl
  
  const { error } = await supabase
    .from('clips')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating clip:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/cortes')
  revalidatePath('/')
  
  return { success: true, error: null }
}

export async function deleteClip(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const { error } = await supabase
    .from('clips')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting clip:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/cortes')
  revalidatePath('/')
  
  return { success: true, error: null }
}

export async function deleteMultipleClips(ids: string[]): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const { error } = await supabase
    .from('clips')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting clips:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/cortes')
  revalidatePath('/')
  
  return { success: true, error: null }
}

export async function getClipStats(): Promise<{
  total: number
  ready: number
  published: number
  pending: number
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total: 0, ready: 0, published: 0, pending: 0 }
  }
  
  const { data, error } = await supabase
    .from('clips')
    .select('status')
    .eq('user_id', user.id)
  
  if (error || !data) {
    return { total: 0, ready: 0, published: 0, pending: 0 }
  }
  
  return {
    total: data.length,
    ready: data.filter(c => c.status === 'ready').length,
    published: data.filter(c => c.status === 'published').length,
    pending: data.filter(c => c.status === 'pending' || c.status === 'processing').length,
  }
}
