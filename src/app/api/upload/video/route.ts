import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadToOss, getOssClient } from '@/lib/alibaba';
import path from 'path';
import { randomUUID } from 'crypto';

interface MultipartPart {
  number: number;
  etag: string;
}

// 分片上传
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
    const chunkIndex = formData.get('chunkIndex') ? Number(formData.get('chunkIndex')) : null;
    const totalChunks = formData.get('totalChunks') ? Number(formData.get('totalChunks')) : null;
    const fileId = formData.get('fileId') as string | null;
    const uploadId = formData.get('uploadId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: '未找到上传的文件' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, message: '只能上传视频文件' },
        { status: 400 }
      );
    }

    // 生成唯一的视频名
    const fileExtension = path.extname(file.name);
    const uniqueId = fileId ? fileId : randomUUID();
    const filename = `videos/${uniqueId}${fileExtension}`;

    // 将文件块转换为buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const client = getOssClient();

    // 实现分片上传
    if (chunkIndex !== null && totalChunks !== null) {
      try {
        // 如果这是第一个块，则初始化多部分上传
        if (chunkIndex === 0 && !uploadId) {
          // @ts-ignore - Ali OSS类型可能不完整
          const initResult = await client.initMultipartUpload(filename);
          
          // 上传第一块
          // @ts-ignore - Ali OSS类型可能不完整
          const uploadPartResult = await client.uploadPart(filename, initResult.uploadId, chunkIndex + 1, buffer,
            {timeout: 300 * 1000} // 设置单次请求的超时时间为 300 秒（单位为毫秒）
          );
          
          return NextResponse.json({
            success: true,
            uploadId: initResult.uploadId,
            etag: uploadPartResult.etag,
            fileId: uniqueId,
            message: '分片上传初始化成功'
          }, { status: 200 });
        }
        
        // 上传中间块
        else if (chunkIndex > 0 && chunkIndex < totalChunks - 1 && uploadId) {
          // @ts-ignore - Ali OSS类型可能不完整
          const uploadPartResult = await client.uploadPart(filename, uploadId, chunkIndex + 1, buffer);
          
          return NextResponse.json({
            success: true,
            uploadId,
            etag: uploadPartResult.etag,
            fileId: uniqueId,
            message: '分片上传进行中'
          }, { status: 200 });
        }
        
        // 上传最终块，完成分片上传
        else if (chunkIndex === totalChunks - 1 && uploadId) {
          // 获取现有部分
          const partsList: MultipartPart[] = formData.get('parts') 
            ? JSON.parse(formData.get('parts') as string) 
            : [];
          
          // 上传最终块
          // @ts-ignore - Ali OSS类型可能不完整
          const finalPartResult = await client.uploadPart(filename, uploadId, chunkIndex + 1, buffer);
          
          // 获取现有部分将最终部分添加到列表中
          partsList.push({
            number: chunkIndex + 1,
            etag: finalPartResult.etag
          });
          
          // 排序
          partsList.sort((a, b) => a.number - b.number);
          
          // 完成分片上传
          // @ts-ignore - Ali OSS类型可能不完整
          const completeResult = await client.completeMultipartUpload(filename, uploadId, partsList);
          
          // 获取URL
          const url = completeResult.res.requestUrls[0].split('?')[0]; //去除参数
          
          return NextResponse.json({
            success: true,
            url,
            fileId: uniqueId,
            message: '视频上传完成'
          }, { status: 200 });
        }
        
        else {
          return NextResponse.json({
            success: false,
            message: '分片上传参数错误'
          }, { status: 400 });
        }
      } catch (error) {
        console.error("分片上传错误:", error);
        
        // 尝试中止分片上传，避免留下不完整的上传
        if (uploadId) {
          try {
            // @ts-ignore - Ali OSS类型可能不完整
            await client.abortMultipartUpload(filename, uploadId);
          } catch (abortError) {
            console.error("中止分片上传错误:", abortError);
          }
        }
        
        throw error;
      }
    } else {
      if (file.size > 1 * 1024 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: '视频大小不能超过1GB' },
          { status: 400 }
        );
      }
      
      const url = await uploadToOss(buffer, filename, file.type);
      
      return NextResponse.json(
        { success: true, url, message: '视频上传成功' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('视频上传失败:', error);
    return NextResponse.json(
      { success: false, message: '视频上传失败' },
      { status: 500 }
    );
  }
}
