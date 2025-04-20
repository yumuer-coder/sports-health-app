'use client';

import React, { useState, useEffect } from 'react';
import { ProfileEditPage } from '@/components/profile/ProfileEditPage';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './edit.module.css';

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

        const response = await axios.get('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUserData(response.data.data.user);
        }
      } catch (error) {
        console.log('获取用户信息失败:', error);
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