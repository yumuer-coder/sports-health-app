'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeScreen } from '@/components/screens/Home';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查用户是否登录
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  return <HomeScreen />;
}
