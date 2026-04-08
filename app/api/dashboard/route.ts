import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Fetch all stats in parallel
    const [
      videosResult,
      clipsResult,
      scheduledResult,
      publishedResult,
      analyticsResult,
      recentVideosResult,
      upcomingPostsResult,
      integrationsResult,
    ] = await Promise.all([
      supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('clips')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'scheduled'),
      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published'),
      supabase
        .from('analytics')
        .select('views, likes, comments, shares')
        .eq('user_id', user.id),
      supabase
        .from('videos')
        .select(`
          id,
          title,
          thumbnail_url,
          status,
          created_at,
          clips:clips(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('scheduled_posts')
        .select(`
          id,
          platform,
          scheduled_for,
          status,
          clip:clips(id, title, thumbnail_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5),
      supabase
        .from('integrations')
        .select('platform, is_active, platform_username, metadata')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ])
    
    // Calculate analytics totals
    const analytics = analyticsResult.data || []
    const totals = analytics.reduce((acc, curr) => ({
      views: acc.views + (curr.views || 0),
      likes: acc.likes + (curr.likes || 0),
      comments: acc.comments + (curr.comments || 0),
      shares: acc.shares + (curr.shares || 0),
    }), { views: 0, likes: 0, comments: 0, shares: 0 })
    
    const totalEngagement = totals.likes + totals.comments + totals.shares
    const engagementRate = totals.views > 0 
      ? ((totalEngagement / totals.views) * 100).toFixed(1)
      : '0.0'
    
    return NextResponse.json({
      stats: {
        totalVideos: videosResult.count || 0,
        totalClips: clipsResult.count || 0,
        scheduledPosts: scheduledResult.count || 0,
        publishedPosts: publishedResult.count || 0,
        totalViews: totals.views,
        totalEngagement,
        engagementRate,
      },
      recentVideos: recentVideosResult.data || [],
      upcomingPosts: upcomingPostsResult.data || [],
      activeIntegrations: integrationsResult.data || [],
    })
    
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}
