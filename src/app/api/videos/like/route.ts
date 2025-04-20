import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// 点赞视频
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

    // 检查用户是否已经点赞过该视频
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('Like')
      .select('id')
      .eq('userId', userId)
      .eq('videoId', videoId)
      .single();

    if (existingLike) {
      return NextResponse.json(
        { success: false, message: '已经点赞过该视频' },
        { status: 400 }
      );
    }

    // 点赞该视频
    const { error: likeError } = await supabase
      .from('Like')
      .insert({
        userId,
        videoId,
        createdAt: new Date().toLocaleString()
      });

      if (likeError) {
        console.error('点赞失败:', likeError);
        return NextResponse.json(
          { success: false, message: '点赞失败' },
          { status: 500 }
        );
      }

     // 根据视频 ID 更新点赞总数
     //  已经在supabase添加了一个rpc函数，用于更新点赞总数
    const { error: updateError } = await supabase
      .rpc('increment_like_count', { video_id: videoId });

    if (updateError) {
      console.error('更新点赞总数失败',updateError)
      return NextResponse.json(
        { success: false, message: '更新点赞总数失败' },
        { status: 500 }
      );
    }

    const { count, error: countError } = await supabase
      .from('Like')
      .select('*', { count: 'exact', head: true })
      .eq('videoId', videoId);

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          isLiked: true,
          likeCount: count || 0
        },
        message: '点赞成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json(
      { success: false, message: '点赞失败' },
      { status: 500 }
    );
  }
}

// 取消点赞
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
      .from('Like')
      .delete()
      .eq('userId', userId)
      .eq('videoId', videoId);

    if (deleteError) {
      console.error('取消点赞失败:', deleteError);
      return NextResponse.json(
        { success: false, message: '取消点赞失败' },
        { status: 500 }
      );
    }

      const { error: updateError } = await supabase
      .rpc('decrement_like_count', { video_id: videoId });

    if (updateError) {
      return NextResponse.json(
        { success: false, message: '更新点赞总数失败' },
        { status: 500 }
      );
    }

    // 获取更新后的点赞总数
    const { count, error: countError } = await supabase
      .from('Like')
      .select('*', { count: 'exact', head: true })
      .eq('videoId', videoId);

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          isLiked: false,
          likeCount: count || 0
        },
        message: '取消点赞成功' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json(
      { success: false, message: '取消点赞失败' },
      { status: 500 }
    );
  }
} 