'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaPlus } from 'react-icons/fa';
import axios from 'axios';
import styles from './WorkoutHome.module.css';
import { DownOutlined, UpOutlined } from '@ant-design/icons'

interface WorkoutHomeProps {
  isAdmin: boolean;
}

interface Exercise {
  id: number;
  videoId: number;
  watchedTime: number;
  createdAt: string;
  video: {
    id: number;
    title: string;
    coverImage: string;
    type: string;
  };
}

export const WorkoutHome: React.FC<WorkoutHomeProps> = ({ isAdmin }) => {
  const router = useRouter();
  const [ workoutPlan, setWorkoutPlan ] = useState<string | null>(null);
  const [ recentExercises, setRecentExercises ] = useState<Exercise[]>([]);
  const [ totalSeconds, setTotalSeconds ] = useState(0);
  const [ loading, setLoading ] = useState(true);
  const [ expand, setExpand ] = useState(true);

  const fetchWorkoutPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/workout/plan', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        setWorkoutPlan(response.data.data.plan);
      }
    } catch (error) {
      console.log('获取健身方案失败:', error);
    }
  };

  // 获取用户最近的运动数据
  const fetchRecentExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // 获取今日的运动记录
      const today = new Date().toLocaleDateString();
      const response = await axios.get(`/api/playrecords?date=${today}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        const records = response.data.data.records || [];
        setRecentExercises(records);

        // 计算今日运动时长
        const userResponse = await axios.get('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.data.success && userResponse.data.data) {
          setTotalSeconds(userResponse.data.data.user?.todayExerciseSeconds || 0);
        }
      }

      setLoading(false);
    } catch (error) {
      console.log('获取运动数据失败:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchWorkoutPlan();
      await fetchRecentExercises();
    };

    fetchData();
  }, []);

  const handleGeneratePlan = () => {
    router.push('/workout/plan');
  };

  const handleUploadVideo = () => {
    router.push('/workout/upload');
  };

  const handleExerciseClick = (videoId: number) => {
    router.push(`/videos/${videoId}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.planSection}>
        <div className={styles.planHeader}>
          <div>
            <h2 className={styles.planTitle}>个性化健身方案</h2>
            <p className={styles.planDescription}>
              您可以生成个性化的健身方案来更好地达成您的健身目标。
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            className={styles.generateButton}
          >
            生成方案
          </button>
        </div>

        {workoutPlan ? (
          <>
            <div onClick={() => setExpand(!expand)} style={{ textAlign: 'end' }}>{expand ? <UpOutlined /> : <DownOutlined />}</div>
            {expand ? <div className={styles.planContent}>
              <p className={styles.planText}>{workoutPlan}</p>
            </div> : <></>}
          </>
        ) : (
          <div className={styles.planContent}>
            <p className={styles.planText}>还未生成健身方案，快去创建吧！</p>
          </div>
        )}
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>今日运动情况</h2>
        <div className={styles.statsHeader}>
          <div className={styles.timeStats}>
            <p className={styles.timeLabel}>今日运动时长</p>
            <p className={styles.timeValue}>{Math.ceil(totalSeconds/60)}分钟</p>
          </div>
        </div>

        <div className={styles.exercisesContainer}>
          <p className={styles.exercisesLabel}>今日训练记录</p>
          {recentExercises.length > 0 ? (
            recentExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={styles.exerciseItem}
                onClick={() => handleExerciseClick(exercise.videoId)}
              >
                <div className={styles.exerciseImage}>
                  <Image
                    src={exercise.video.coverImage}
                    alt={exercise.video.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.exerciseInfo}>
                  <p className={styles.exerciseTitle}>{exercise.video.title}</p>
                  <p className={styles.exerciseDuration}>{(exercise.watchedTime / 60).toFixed(1)}分钟</p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noExerciseText}>暂无训练记录</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className={styles.adminSection}>
          <div className={styles.adminHeader}>
            <h2 className={styles.adminTitle}>管理员功能</h2>
            <button
              onClick={handleUploadVideo}
              className={styles.uploadButton}
            >
              <FaPlus size={14} />
              <span>上传视频</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 