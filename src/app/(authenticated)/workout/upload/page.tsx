'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './upload.module.css';
import VideoUploadPage from '@/components/workout/VideoUploadPage';

export default function VideoUpload() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // 检查用户是否是admin
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/workout');
      return;
    }
    
    setIsAdmin(true);
  }, []);

  if (!isAdmin) {
    return (<div className={styles["loading-container"]}>
      <div className={styles.spinner}></div>
    </div>)
  }

  return <VideoUploadPage />;
} 