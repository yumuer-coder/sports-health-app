import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadToOss } from '@/lib/alibaba';
import path from 'path';
import { randomUUID } from 'crypto';

// 上传图片到OSS
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
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '未找到上传的文件' },
        { status: 400 }
      );
    }

    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: '图片大小不能超过1MB' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: '只能上传图片文件' },
        { status: 400 }
      );
    }

    // 将文件转换为buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 生成唯一的文件名
    const fileExtension = path.extname(file.name);
    const filename = `images/${randomUUID()}${fileExtension}`;

    const url = await uploadToOss(buffer, filename, file.type);

    return NextResponse.json(
      { success: true, url, message: '图片上传成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { success: false, message: '图片上传失败' },
      { status: 500 }
    );
  }
}
