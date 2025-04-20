import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// 添加视频到收藏
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    const { videoId } = await request.json();
    const userId = payload.sub;

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: '缺少视频ID' },
        { status: 400 }
      );
    }

    // 检查视频是否存在
    const { data: video, error: videoError } = await supabase
      .from('Video')
      .select('id')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { success: false, message: '视频不存在' },
        { status: 404 }
      );
    }

    const { data: existingFavorite, error: favoriteCheckError } = await supabase
      .from('Favorite')
      .select('id')
      .eq('userId', userId)
      .eq('videoId', videoId)
      .single();

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, message: '已经收藏过该视频' },
        { status: 400 }
      );
    }

    // 添加视频到收藏
    const { error: favoriteError } = await supabase
      .from('Favorite')
      .insert({
        userId,
        videoId,
        createdAt: new Date().toLocaleString()
      });

    if (favoriteError) {
      console.error('收藏失败:', favoriteError);
      return NextResponse.json(
        { success: false, message: '收藏失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          isFavorite: true
        },
        message: '收藏成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('收藏失败:', error);
    return NextResponse.json(
      { success: false, message: '收藏失败' },
      { status: 500 }
    );
  }
}

// 从收藏中移除
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    const { videoId } = await request.json();
    const userId = payload.sub;

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: '缺少视频ID' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('Favorite')
      .delete()
      .eq('userId', userId)
      .eq('videoId', videoId);

    if (deleteError) {
      console.error('取消收藏失败:', deleteError);
      return NextResponse.json(
        { success: false, message: '取消收藏失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          isFavorite: false
        },
        message: '取消收藏成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('取消收藏失败:', error);
    return NextResponse.json(
      { success: false, message: '取消收藏失败' },
      { status: 500 }
    );
  }
} 