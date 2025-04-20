'use client';

import { VideoDetailPage } from '@/components/workout/VideoDetailPage';
import { useParams } from 'next/navigation'; 
import React from 'react';
export default function VideoDetail() {
  const params = useParams(); // 使用useParams获取路由参数
  const videoId = params.id as string; 

  return <VideoDetailPage videoId={videoId} />;
}