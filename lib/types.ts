export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ClipStatus = 'pending' | 'processing' | 'ready' | 'published' | 'failed'
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'kwai' | 'facebook' | 'twitter'
export type PostStatus = 'scheduled' | 'published' | 'failed' | 'cancelled'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  user_id: string
  title: string
  description: string | null
  source_url: string
  thumbnail_url: string | null
  duration: number | null
  status: VideoStatus
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Clip {
  id: string
  video_id: string
  user_id: string
  title: string
  description: string | null
  start_time: number
  end_time: number
  duration: number
  clip_url: string | null
  thumbnail_url: string | null
  status: ClipStatus
  ai_score: number | null
  ai_analysis: AIAnalysis | null
  created_at: string
  updated_at: string
  video?: Video
}

export interface AIAnalysis {
  hook_score: number
  engagement_potential: number
  viral_probability: number
  suggested_hashtags: string[]
  suggested_caption: string
  best_platforms: Platform[]
  highlights: string[]
  transcript_snippet: string
}

export interface Integration {
  id: string
  user_id: string
  platform: Platform
  access_token: string | null
  refresh_token: string | null
  platform_user_id: string | null
  platform_username: string | null
  is_active: boolean
  expires_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ScheduledPost {
  id: string
  clip_id: string
  user_id: string
  integration_id: string
  platform: Platform
  scheduled_for: string
  caption: string | null
  hashtags: string[] | null
  status: PostStatus
  published_at: string | null
  platform_post_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  clip?: Clip
  integration?: Integration
}

export interface Analytics {
  id: string
  post_id: string
  user_id: string
  platform: Platform
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number | null
  recorded_at: string
  created_at: string
}

// API Request/Response Types
export interface AnalyzeVideoRequest {
  url: string
  title?: string
  settings?: {
    maxClips?: number
    minDuration?: number
    maxDuration?: number
    detectHighlights?: boolean
    generateCaptions?: boolean
  }
}

export interface AnalyzeVideoResponse {
  video: Video
  message: string
}

export interface GenerateClipsRequest {
  videoId: string
}

export interface GenerateClipsResponse {
  clips: Clip[]
  message: string
}

export interface SchedulePostRequest {
  clipId: string
  platforms: Platform[]
  scheduledFor: string
  caption?: string
  hashtags?: string[]
}

export interface SchedulePostResponse {
  posts: ScheduledPost[]
  message: string
}

export interface ConnectIntegrationRequest {
  platform: Platform
  authCode?: string
  accessToken?: string
  refreshToken?: string
}

export interface DashboardStats {
  totalVideos: number
  totalClips: number
  scheduledPosts: number
  publishedPosts: number
  totalViews: number
  totalEngagement: number
}
