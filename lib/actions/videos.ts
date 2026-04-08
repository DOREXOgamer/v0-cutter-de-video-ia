'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Video, VideoStatus } from '@/lib/types'

export async function getVideos(): Promise<Video[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }
  
  return data as Video[]
}

export async function getVideo(id: string): Promise<Video | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching video:', error)
    return null
  }
  
  return data as Video
}

export async function createVideo(input: {
  title: string
  sourceUrl: string
  description?: string
  thumbnailUrl?: string
  duration?: number
}): Promise<{ video: Video | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { video: null, error: 'Usuário não autenticado' }
  }
  
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      title: input.title,
      source_url: input.sourceUrl,
      description: input.description || null,
      thumbnail_url: input.thumbnailUrl || null,
      duration: input.duration || null,
      status: 'pending' as VideoStatus,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating video:', error)
    return { video: null, error: error.message }
  }
  
  revalidatePath('/upload')
  revalidatePath('/')
  
  return { video: data as Video, error: null }
}

export async function updateVideoStatus(
  id: string,
  status: VideoStatus,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const updateData: Record<string, unknown> = { status }
  if (metadata) {
    updateData.metadata = metadata
  }
  
  const { error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating video:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/upload')
  revalidatePath('/')
  revalidatePath('/cortes')
  
  return { success: true, error: null }
}

export async function deleteVideo(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }
  
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting video:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/upload')
  revalidatePath('/')
  revalidatePath('/cortes')
  
  return { success: true, error: null }
}

export async function getVideoStats(): Promise<{
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
  }
  
  const { data, error } = await supabase
    .from('videos')
    .select('status')
    .eq('user_id', user.id)
  
  if (error || !data) {
    return { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
  }
  
  return {
    total: data.length,
    pending: data.filter(v => v.status === 'pending').length,
    processing: data.filter(v => v.status === 'processing').length,
    completed: data.filter(v => v.status === 'completed').length,
    failed: data.filter(v => v.status === 'failed').length,
  }
}
