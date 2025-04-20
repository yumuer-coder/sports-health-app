import { NextRequest, NextResponse } from 'next/server';
import { uploadToOss } from '@/lib/alibaba';
import { verifyToken } from '@/lib/auth';
import supabase from '@/lib/supabase';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '未提供图片' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '无效的文件类型，只能上传jpeg、png、webp格式的图片' },
        { status: 400 }
      );
    }

    // 将文件转换成buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成唯一的filename
    const timestamp = Date.now();
    const userId = payload.sub;
    const fileExtension = file.name.split('.').pop();
    const filename = `avatars/${userId}_${timestamp}.${fileExtension}`;

    // 上传到OSS
    const url = await uploadToOss(buffer, filename, file.type);

    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        avatar: url
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: '头像上传失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      message: '头像上传成功'
    });

  } catch (error) {
    console.error('头像上传失败:', error);
    return NextResponse.json(
      { success: false, message: '头像上传失败' },
      { status: 500 }
    );
  }
} 