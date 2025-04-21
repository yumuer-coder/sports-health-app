'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import http, { publicAxios } from '@/lib/axios';
import styles from './WorkoutList.module.css';
import toast from 'react-hot-toast';

interface Video {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  duration: number;
  isLiked?: boolean;
  isFavorite?: boolean;
  likeCount: number;
}

interface WorkoutListProps {
  type: string;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({ type }) => {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [type, page]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const req = token ? http : publicAxios;
      const response = await req.get(`/api/videos?type=${type}&page=${page}&limit=10`);

      if (response.data.success) {
        const newVideos = response.data.data.videos;
        
        if (page === 1) {
          setVideos(newVideos);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
        }
        
        setHasMore(page < response.data.data.pagination.totalPages);
      }
    } catch (error: any) {
      console.log('获取视频失败:', error);
      toast.error(error.message || '获取视频失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: number) => {
    router.push(`/videos/${videoId}`);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // 显示骨架屏
  if (loading && videos?.length === 0) {
    return (
      <div className={styles.skeletonContainer}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className={styles.skeletonItem}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonText}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.videoList}>
        {videos?.map(video => (
          <div
            key={video.id}
            className={styles.videoCard}
            onClick={() => handleVideoClick(video.id)}
          >
            <div className={styles.videoImageContainer}>
              <Image
                src={video.coverImage}
                alt={video.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.videoDuration}>
              {String(Math.floor(video.duration / 360)).padStart(2, '0')}:{String(Math.floor(video.duration / 60)).padStart(2, '0')}:{(video.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className={styles.videoContent}>
              <div className={styles.videoTitleContainer}>
                <div className={styles.videoTitle}>{video.title}</div>
                <div className={styles.likeCount}>
                  {video.likeCount} 人点赞
                </div>
              </div>
              <div className={styles.videoDescription}>{video.description}</div>
            </div>
          </div>
        ))}

        {videos?.length === 0 && !loading && (
          <div className={styles.emptyState}>
            暂无{type === 'workout' ? '健身' : '瑜伽'}视频
          </div>
        )}

        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <button
              onClick={loadMore}
              disabled={loading}
              className={styles.loadMoreButton}
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 