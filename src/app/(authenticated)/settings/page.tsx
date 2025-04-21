'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import { Modal } from "antd";
import toast from 'react-hot-toast';

export default function Settings() {
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 获取localStorage中的userId
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleLogout = async () => {
    const confirmed = await modal.confirm({
      content: '确认退出吗？'});
      if (confirmed) {
        try {
          if (userId) {
            // 发送请求到服务器清除Redis缓存和数据库中的token
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId }),
            });
          }
        } catch (error: any) {
          console.error('退出登录时出错:', error);
          toast.error(error.message || '退出登录时出错');
        } finally {
          // 无论服务器请求是否成功，都清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('userId');
          // 重定向到登录页
          router.push('/login');
        }
      } 
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <button
        className={styles.logoutButton}
        onClick={handleLogout}
      >
        退出登录
      </button>
    </div>
  );
} 