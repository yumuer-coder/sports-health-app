'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import http from '@/lib/axios';
import { FaTrash, FaPlay } from 'react-icons/fa';
import styles from './FavoritesPage.module.css';
import toast from 'react-hot-toast';
interface Video {
  id: number;
  title: string;
  coverImage: string;
  duration: number;
  type: string;
  likeCount: number;
  favorited: boolean;
}

export const FavoritesPage = () => {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await http.get('/api/favorites');

      if (response.data.success) {
        setFavorites(response.data.data?.videos);
      }
    } catch (error: any) {
      console.log('获取收藏状态失败:', error);
      toast.error(error.message || '获取收藏状态失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setDeleting(videoId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await http.delete('/api/videos/favorite', {
        data: { videoId },
      });

      if (response.data.success) {
        setFavorites((prev) => prev.filter((video) => video.id !== videoId));
      }
    } catch (error: any) {
      console.log('取消收藏失败:', error);
      toast.error(error.message || '取消收藏失败');
    } finally {
      setDeleting(null);
    }
  };

  const handleVideoClick = (videoId: number) => {
    router.push(`/videos/${videoId}`);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles["page-container"]}>
      {/* 头部 */}
      <div className={styles["header"]}>
        <h1 className={styles["page-title"]}>我的收藏</h1>
      </div>

      {loading ? (
        <div className={styles["loading-container"]}>
          <div className={styles["spinner"]}></div>
        </div>
      ) : favorites?.length > 0 ? (
        <div className={styles["content-container"]}>
          {deleting ? <div className={styles["deleting-container"]}>
          <div className={styles["spinner"]}></div>
        </div>:<></>}
          {favorites?.map((video) => (
            <div
              key={video.id}
              className={styles["video-card"]}
              onClick={() => handleVideoClick(video.id)}
            >
              <div className={styles["video-thumbnail"]}>
                <Image
                  src={video.coverImage}
                  alt={video.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles["thumbnail-overlay"]}>
                  <div className={styles["play-button"]}>
                    <FaPlay className={styles["play-icon"]} size={24} />
                  </div>
                </div>
                <div className={styles["duration-badge"]}>
                  {formatDuration(video.duration)}
                </div>
              </div>
              <div className={styles["video-info"]}>
                <div className={styles["video-text"]}>
                  <h3 className={styles["video-title"]}>{video.title}</h3>
                  <p className={styles["video-stats"]}>{video.likeCount} 赞</p>
                </div>
                <button
                  onClick={(e) => handleRemoveFavorite(video.id, e)}
                  disabled={deleting === video.id}
                  className={styles["action-button"]}
                  aria-label="取消收藏"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles["empty-state"]}>
          <p className={styles["empty-message"]}>暂无收藏内容</p>
          <p className={styles["empty-hint"]}>
            您可以在健身视频页面点击收藏图标添加收藏
          </p>
        </div>
      )}
    </div>
  );
}; 