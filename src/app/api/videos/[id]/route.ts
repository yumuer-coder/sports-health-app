import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { success: false, message: '无效的视频ID' },
        { status: 400 }
      );
    }

    const { data: video, error } = await supabase
        .from('Video')
        .select('*')
        .eq('id', videoId)
        .single();

    if (error || !video) {
        return NextResponse.json(
          { success: false, message: '视频不存在' },
          { status: 404 }
        );
      }

    // 检查该用户是否点赞或收藏此视频
    let isLiked = false;
    let isFavorite = false;

    if (userId) {
        const { data: likeData, error: userLikeError } = await supabase
          .from('Like')
          .select('id')
          .eq('userId', Number(userId))
          .eq('videoId', videoId)
          .single();

      isLiked = !!likeData;
        
        const { data: favoriteData, error: userFavoriteError } = await supabase
          .from('Favorite')
          .select('id')
          .eq('userId', Number(userId))
          .eq('videoId', videoId)
          .single();

      isFavorite = !!favoriteData;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...video,
          isLiked,
          isFavorite,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取视频详情时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取视频详情时出错' },
      { status: 500 }
    );
  }
} 