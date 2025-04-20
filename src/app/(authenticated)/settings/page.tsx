'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';
import { Modal } from "antd";

export default function Settings() {
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();
  const handleLogout = async () => {
    const confirmed = await modal.confirm({
      content: '确认退出吗？'});
      if (confirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        // 重定向到登录页
        router.push('/login');
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