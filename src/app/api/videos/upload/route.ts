import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { videoTypes } from '@/types/video';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: '无权限上传视频' },
        { status: 403 }
      );
    }

    // 解析 JSON 请求体
    const body = await request.json();

    // 获取字段
    const title = body.title as string;
    const description = body.description as string;
    const type = body.type as string;
    const durationSeconds = parseInt(body.duration as string, 10);
    const videoUrl = body.videoUrl as string;
    const coverImage = body.coverImage as string;

    if (!title || !type || !videoUrl || !coverImage || !durationSeconds) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (!videoTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: '不支持的视频类型' },
        { status: 400 }
      );
    }

    // 创建视频记录
    const { data: video, error: createError } = await supabase
      .from('Video')
      .insert({
        title,
        description: description || null,
        type,
        coverImage,
        videoUrl,
        likeCount: 0,
        duration: durationSeconds,
        uploadedAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      })
      .select()
      .single();

    if (createError) {
      console.error('视频上传失败:', createError);
      return NextResponse.json(
        { success: false, message: '视频上传失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '视频上传成功', data: video },
      { status: 201 }
    );
  } catch (error) {
    console.error('视频上传失败:', error);
    return NextResponse.json(
      { success: false, message: '视频上传失败' },
      { status: 500 }
    );
  }
} 