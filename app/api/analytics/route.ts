import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
    
    // Get analytics data
    const { data: analytics, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get video and clip counts
    const [
      { count: totalVideos },
      { count: totalClips },
      { count: scheduledPosts },
      { count: publishedPosts },
    ] = await Promise.all([
      supabase.from('videos').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('clips').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled'),
      supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
    ])
    
    // Calculate totals
    const totals = (analytics || []).reduce((acc, curr) => ({
      views: acc.views + (curr.views || 0),
      likes: acc.likes + (curr.likes || 0),
      comments: acc.comments + (curr.comments || 0),
      shares: acc.shares + (curr.shares || 0),
    }), { views: 0, likes: 0, comments: 0, shares: 0 })
    
    // Calculate engagement rate
    const engagementRate = totals.views > 0 
      ? ((totals.likes + totals.comments + totals.shares) / totals.views) * 100 
      : 0
    
    // Group by platform
    const byPlatform = (analytics || []).reduce((acc, curr) => {
      if (!acc[curr.platform]) {
        acc[curr.platform] = { views: 0, likes: 0, comments: 0, shares: 0 }
      }
      acc[curr.platform].views += curr.views || 0
      acc[curr.platform].likes += curr.likes || 0
      acc[curr.platform].comments += curr.comments || 0
      acc[curr.platform].shares += curr.shares || 0
      return acc
    }, {} as Record<string, { views: number; likes: number; comments: number; shares: number }>)
    
    return NextResponse.json({
      stats: {
        totalVideos: totalVideos || 0,
        totalClips: totalClips || 0,
        scheduledPosts: scheduledPosts || 0,
        publishedPosts: publishedPosts || 0,
        ...totals,
        engagementRate: Math.round(engagementRate * 100) / 100,
      },
      byPlatform,
      recentAnalytics: analytics?.slice(0, 10) || [],
      period,
    })
    
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar analytics' },
      { status: 500 }
    )
  }
}
