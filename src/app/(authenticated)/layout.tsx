'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaDumbbell, FaUtensils, FaUser } from 'react-icons/fa';
import { BottomNavbar } from '@/components/ui/BottomNavbar';
import styles from './layout.module.css';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('workout');
  const [isClient, setIsClient] = useState(false);

  // 隐藏导航栏的页面
  const hideNavbarRoutes = [
    '/profile/edit',
    '/profile/complete',
    '/workout/plan',
    '/workout/upload'
  ];
  const isVideoDetailPage = pathname?.startsWith('/videos/') && pathname?.split('/').length > 2;
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname || '') && !isVideoDetailPage;


  useEffect(() => {
    setIsClient(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (pathname.includes('/workout')) {
      setActiveTab('workout');
    } else if (pathname.includes('/diet')) {
      setActiveTab('diet');
    } else if (pathname.includes('/profile')) {
      setActiveTab('profile');
    }
  }, [pathname, router]);

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

  // 不要在服务器端渲染任何内容，以免hydration不匹配
  if (!isClient) {
    return null;
  }

  return (<>
    <div className={styles["my-container"]}>
      {children}
      {shouldShowNavbar ? <BottomNavbar
        activeTab={activeTab}
        items={navItems}
        onChange={handleTabChange}
      /> : <></>}
    </div>
    </>);
} 