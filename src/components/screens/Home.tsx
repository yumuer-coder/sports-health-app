'use client';

import React, { useState, useEffect } from 'react';
import { FaDumbbell, FaUtensils, FaUser } from 'react-icons/fa';
import { BottomNavbar } from '@/components/ui/BottomNavbar';
import { WorkoutTabs } from '@/components/workout/WorkoutTabs';
import { DietPage } from '@/components/diet/DietPage';
import { ProfilePage } from '@/components/profile/ProfilePage';
import styles from './Home.module.css';
import { usePathname, useRouter } from 'next/navigation';

// type Tab = 'workout' | 'diet' | 'profile';

export const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState<string>('workout');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const hideNavbarRoutes = [
    '/profile/edit',
    '/profile/complete',
    '/workout/plan',
    '/workout/upload'
  ];
  // 检查当前路径是否以/vides/开头，是否有更多路径（用于/vides/[id]）
  const isVideoDetailPage = pathname?.startsWith('/videos/') && pathname?.split('/').length > 2;
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname || '') && !isVideoDetailPage;


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserData({...data.data.user,workoutPlan:data.data.workoutPlan});
          }
        }
      } catch (error) {
        console.log('获取用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'workout':
        router.push('/workout');
        break;
      case 'diet':
        router.push('/diet');
        break;
      case 'profile':
        router.push('/profile');
        break;
      default:
        break;
    }
  };

  const navItems = [
    {
      id: 'workout',
      label: '健身',
      icon: <FaDumbbell />,
    },
    {
      id: 'diet',
      label: '饮食',
      icon: <FaUtensils />,
    },
    {
      id: 'profile',
      label: '我的',
      icon: <FaUser />,
    },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {activeTab === 'workout' && <WorkoutTabs />}
        {activeTab === 'diet' && <DietPage />}
        {activeTab === 'profile' && <ProfilePage userData={userData} />}
      </div>
      {shouldShowNavbar ? <BottomNavbar
        activeTab={activeTab}
        items={navItems}
        onChange={handleTabChange}
      /> : <></>}
    </div>
  );
}; 