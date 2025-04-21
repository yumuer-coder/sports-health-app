'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import http from '@/lib/axios';
import { FaHeart, FaStar, FaRegHeart, FaRegStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './VideoDetailPage.module.css';

interface VideoDetailPageProps {
  videoId: string;
}

interface VideoDetail {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  coverImage: string;
  type: string;
  duration: number;
  likeCount: number;
  isLiked: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export const VideoDetailPage: React.FC<VideoDetailPageProps> = ({ videoId }) => {
  const router = useRouter();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isLike, setIsLike] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchTimeRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchVideoDetail();
    
    // 在组件卸载时清理
    return () => {
      saveWatchTime();
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    };
    
  }, [videoId]);

  

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 360);
    const minutes = Math.floor((seconds % 360) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchVideoDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await http.get(`/api/videos/${videoId}`);

      if (response.data.success) {
        setVideo(response.data.data);
        setIsLike(response.data.data.isLiked);
        setIsFavorite(response.data.data.isFavorite);
      }
    } catch (error: any) {
        toast.error(error.message || '获取视频详情失败');
        console.log('获取视频详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当视频播放时会触发此函数
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      
      // 仅在自上次更新以来，已超过一秒的情况下计算时间
      // 这会阻止在视频中搜索时进行计数
      if (Math.abs(currentTime - lastTimeUpdateRef.current) < 5) {
        const incrementalTime = currentTime - lastTimeUpdateRef.current;
        if (incrementalTime > 0) {
          watchTimeRef.current += incrementalTime;
          
          // 每十秒上报进度
          if (Math.floor(watchTimeRef.current / 20) > Math.floor((watchTimeRef.current - incrementalTime) / 20)) {
            saveWatchTime();
          }
        }
      }
      
      lastTimeUpdateRef.current = currentTime;
    }
  };

  // 将观看时间发送给后端
  const saveWatchTime = async () => {
    if (watchTimeRef.current <= 3 || !video) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const time = Math.round(watchTimeRef.current)
      watchTimeRef.current = 0;
      await http.post(
        '/api/playrecords',
        {
          videoId: video.id,
          watchedTime: time
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
    } catch (error: any) {
      console.log('保存视频观看进度失败:', error);
      toast.error(error.message || '保存视频观看进度失败');
    }
  };

  const handleLike = async () => {
    if (!video || isLiking) return;

    try {
      setIsLiking(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = `/api/videos/like`;

      let response;
      if (isLike) {
        response = await http.delete(url, {
          data: { videoId: video.id },
        });
      } else {
        response = await http.post(url, 
          { videoId: video.id });
      }

      if (response.data.success) {
        setVideo({
          ...video,
          likeCount: response.data.data.likeCount,
        });
        setIsLike(response.data.data.isLiked);
      }
    } catch (error: any) {
      console.log('点赞/取消点赞失败:', error);
      toast.error(error.message || '点赞/取消点赞失败');
    } finally {
      setIsLiking(false);
    }
  };

  const handleFavorite = async () => {
    if (!video || isFavoriting) return;

    try {
      setIsFavoriting(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const method = isFavorite ? 'delete' : 'post';
      
      let response;
      if (method === 'delete') {
        response = await http.delete('/api/videos/favorite', {
          data: { videoId: video.id },
        });
      } else {
        response = await http.post('/api/videos/favorite', 
          { videoId: video.id });
      }

      if (response.data.success) {
        setVideo({
          ...video,
        });
        setIsFavorite(response.data.data.isFavorite);
      }
    } catch (error: any) {
      console.log('点赞/取消点赞失败:', error);
      toast.error(error.message || '点赞/取消点赞失败');
    } finally {
      setIsFavoriting(false);
    }
  };


  if (loading || !video) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 视频播放器 */}
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.coverImage}
          controls
          autoPlay
          playsInline
          className={styles.video}
          onTimeUpdate={handleTimeUpdate}
          onPause={() => saveWatchTime()}
        />
      </div>

      {/* 视频详情 */}
      <div className={styles.infoContainer}>
        <div className={styles.infoContent}>
          <h2 className={styles.videoTitle}>{video.title}</h2>
          <p className={styles.description}>
            {video.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ marginRight: '1rem' }}>时长：{formatDuration(video.duration)}</span>
            <span>{video.likeCount} 赞</span>
          </div>
          
        </div>

        <div className={styles.actionBar}>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={styles.actionButton}
          >
            {isLike ? (
              <>
              <FaHeart className={styles.likedIcon} size={24} />
              <span className={styles.actionText}>已点赞</span></>
            ) : (
              <>

              <FaRegHeart size={24} />
              <span className={styles.actionText}>点赞</span></>
            )}
            
          </button>
          <button
            onClick={handleFavorite}
            disabled={isFavoriting}
            className={styles.actionButton}
          >
            {isFavorite ? (
              <>
              <FaStar className={styles.favoritedIcon} size={24} />
              <span className={styles.actionText}>已收藏</span></>
            ) : (
              <>
              <FaRegStar size={24} />
              <span className={styles.actionText}>收藏</span></>
            )}
            
          </button>
        </div>
      </div>
      <div className={styles.secondLoding}>{isLiking || isFavoriting?<div className={styles.loadingSpinner}></div>:<></>}</div>
    </div>
  );
}; 