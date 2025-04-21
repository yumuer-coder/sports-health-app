import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 获取用户收藏的视频
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    // 计算分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: favorites, error: fetchError } = await supabase
      .from('Favorite')
      .select('id, videoId, createdAt')
      .eq('userId', Number(userId))
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (fetchError) {
      console.error('获取收藏错误:', fetchError);
      throw fetchError;
    }

    // const { count: totalCount, error: countError } = await supabase
    //   .from('Favorite')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('userId', Number(userId));

    // if (countError) {
    //   console.error('获取收藏错误:', countError);
    //   throw countError;
    // }

    // 返回空列表
    if (favorites.length === 0) {
      return NextResponse.json(
        { 
        success: true, 
        data: {
          videos: [],
          pagination: {
            page,
            limit,
            total:  0,
            totalPages: 0,
          }
        }
        },
        { status: 200 }
      );
    }

    // 提取视频ID
    const videoIds = favorites.map(fav => fav.videoId);

    // 用videoId获取视频
    const { data: videos, error: videosError } = await supabase
      .from('Video')
      .select('*')
      .in('id', videoIds);

    if (videosError) {
      console.error('查找视频失败:', videosError);
      throw videosError;
    }

    // 
    const videosWithFavorite = videos.map(video => ({
      ...video,
      isFavorite: true,
    }));

    return NextResponse.json(
      { 
      success: true, 
      data: {
        videos: videosWithFavorite,
        pagination: {
          page,
          limit,
          total: videosWithFavorite?.length || 0,
          totalPages: Math.ceil((videosWithFavorite?.length || 0) / limit),
        }
      }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取收藏列表时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取收藏列表时出错' },
      { status: 500 }
    );
  }
} 