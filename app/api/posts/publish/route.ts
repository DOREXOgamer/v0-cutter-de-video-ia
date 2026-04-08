import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Simulated publishing function - in production, this would call each platform's API
async function publishToPlataform(post: {
  id: string
  platform: string
  clip: { clip_url: string | null; title: string } | null
  caption: string | null
  hashtags: string[] | null
  integration: { access_token: string | null } | null
}): Promise<{ success: boolean; platformPostId?: string; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate 90% success rate
  const success = Math.random() > 0.1
  
  if (success) {
    return {
      success: true,
      platformPostId: `${post.platform}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }
  }
  
  return {
    success: false,
    error: 'Falha na conexão com a API da plataforma',
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
    const { postId } = body
    
    if (!postId) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 })
    }
    
    // Get post with clip and integration
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        clip:clips(id, title, clip_url, thumbnail_url),
        integration:integrations(id, platform, access_token, platform_username)
      `)
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()
    
    if (postError || !post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }
    
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Post já foi publicado' }, { status: 400 })
    }
    
    // Publish to platform
    const result = await publishToPlataform(post as {
      id: string
      platform: string
      clip: { clip_url: string | null; title: string } | null
      caption: string | null
      hashtags: string[] | null
      integration: { access_token: string | null } | null
    })
    
    if (result.success) {
      // Update post status
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.platformPostId,
        })
        .eq('id', postId)
      
      // Update clip status
      if (post.clip) {
        await supabase
          .from('clips')
          .update({ status: 'published' })
          .eq('id', post.clip.id)
      }
      
      // Create initial analytics record
      await supabase
        .from('analytics')
        .insert({
          post_id: postId,
          user_id: user.id,
          platform: post.platform,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement_rate: 0,
          recorded_at: new Date().toISOString(),
        })
      
      return NextResponse.json({
        success: true,
        platformPostId: result.platformPostId,
        message: `Post publicado com sucesso no ${post.platform}!`,
      })
    } else {
      // Update post with error
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'failed',
          error_message: result.error,
        })
        .eq('id', postId)
      
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { error: 'Erro interno ao publicar post' },
      { status: 500 }
    )
  }
}

// Batch publish multiple posts
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { postIds } = body
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'IDs dos posts são obrigatórios' }, { status: 400 })
    }
    
    const results = {
      published: [] as string[],
      failed: [] as { id: string; error: string }[],
    }
    
    for (const postId of postIds) {
      // Get post
      const { data: post, error: postError } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          clip:clips(id, title, clip_url),
          integration:integrations(id, platform, access_token)
        `)
        .eq('id', postId)
        .eq('user_id', user.id)
        .single()
      
      if (postError || !post) {
        results.failed.push({ id: postId, error: 'Post não encontrado' })
        continue
      }
      
      if (post.status === 'published') {
        results.failed.push({ id: postId, error: 'Post já publicado' })
        continue
      }
      
      const result = await publishToPlataform(post as {
        id: string
        platform: string
        clip: { clip_url: string | null; title: string } | null
        caption: string | null
        hashtags: string[] | null
        integration: { access_token: string | null } | null
      })
      
      if (result.success) {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            platform_post_id: result.platformPostId,
          })
          .eq('id', postId)
        
        results.published.push(postId)
      } else {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: result.error,
          })
          .eq('id', postId)
        
        results.failed.push({ id: postId, error: result.error || 'Erro desconhecido' })
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: `${results.published.length} posts publicados, ${results.failed.length} falhas`,
    })
    
  } catch (error) {
    console.error('Error batch publishing:', error)
    return NextResponse.json(
      { error: 'Erro interno ao publicar posts' },
      { status: 500 }
    )
  }
}
