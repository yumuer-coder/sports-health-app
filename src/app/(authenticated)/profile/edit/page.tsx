'use client';

import React, { useState, useEffect } from 'react';
import { ProfileEditPage } from '@/components/profile/ProfileEditPage';
import http from '@/lib/axios';
import { useRouter } from 'next/navigation';
import styles from './edit.module.css';
import toast from 'react-hot-toast';
export default function ProfileEdit() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return
        };

        const response = await http.get('/api/user/profile');

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

  return <ProfileEditPage userData={userData} />;
} 