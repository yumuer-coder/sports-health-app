'use client';

import React, { useState, useEffect } from 'react';
import { ProfilePage } from '@/components/profile/ProfilePage';
import http from '@/lib/axios';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import toast from 'react-hot-toast';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        
        if (!token || !userId) {
          console.log('localStorage中没有token或userId');
          router.push('/login');
          return;
        }
        
        console.log('用户ID:', userId);

        // 直接在请求体中传递用户ID，而不是依赖中间件读取令牌
        const response = await http.get('/api/user/profile');

        if (response.status === 401) {
          // 重定向到登录页
          router.push('/login');
        }
        if (response.data.success) {
          setUserData(response.data.data.user);
        }
      } catch (error: any) {
        console.log('获取用户信息失败:', error);
        toast.error(error.message || '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (<div className={styles["loading-container"]}>
      <div className={styles.spinner}></div>
    </div>)
  }

  return <ProfilePage userData={userData} />;
} 