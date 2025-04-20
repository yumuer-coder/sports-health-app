import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const type = request.nextUrl.searchParams.get('type');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    if (!type) {
      return NextResponse.json(
        { success: false, message: '请提供视频类型' },
        { status: 400 }
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: videos, error, count } = await supabase
      .from('Video')
      .select('*', { count: 'exact' })
      .eq('type', type)
      .order('uploadedAt', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('获取视频列表时出错:', error);
      return NextResponse.json(
        { success: false, message: '获取视频列表时出错' },
        { status: 500 }
      );
    }

    // 如果用户已登录，添加收藏和点赞状态
    let enrichedVideos = videos || [];
    if (userId && videos && videos.length > 0) {
      const { data: userFavorites, error: favError } = await supabase
        .from('Favorite')
        .select('videoId')
        .eq('userId', Number(userId));

      const { data: userLikes, error: likeError } = await supabase
        .from('Like')
        .select('videoId')
        .eq('userId', Number(userId));

      if (!favError && !likeError && userFavorites && userLikes) {
        const favoriteIds = new Set(userFavorites.map(fav => fav.videoId));
        const likeIds = new Set(userLikes.map(like => like.videoId));

        enrichedVideos = videos.map(video => ({
          ...video,
          isFavorite: favoriteIds.has(video.id),
          isLiked: likeIds.has(video.id),
        }));
      }
    }

    const totalCount = count || 0;

    const response = { 
      success: true, 
      data: {
        videos: enrichedVideos,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        }
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('获取视频列表时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取视频列表时出错' },
      { status: 500 }
    );
  }
}