'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaChevronRight, FaCog, FaHeart, FaQuestion, FaSync } from 'react-icons/fa';
import { GiHealthNormal } from 'react-icons/gi';
import React from 'react';
import styles from './ProfilePage.module.css';

interface UserData {
  id: number;
  name: string;
  avatar?: string;
  gender: 'male' | 'female';
  birthday?: string;
  height?: number;
  weight?: number;
  totalExerciseSeconds: number;
  todayExerciseSeconds: number;
    weeklyWorkoutDays: number;
}

interface ProfilePageProps {
  userData: UserData | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData }) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // 默认统计数据
  const stats = {
    totalMinutes: Math.ceil((userData?.totalExerciseSeconds  || 0 ) / 60),
    todayMinutes: Math.ceil((userData?.todayExerciseSeconds  || 0 ) / 60),
    weeklyWorkoutDays: userData?.weeklyWorkoutDays || 0,
  };

  if (!userData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>我的</h1>
      </div>

      <div className={styles.content}>
        {/* 用户信息卡片 */}
        <div className={styles.profileCard}>
          <div className={styles.profileInfo}>
            <div className={styles.avatarContainer}>
              {userData.avatar ? (
                <Image
                  src={userData.avatar}
                  alt={userData.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span className={styles.avatarInitial}>
                    {userData.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>{userData.name}</h2>
              <p className={styles.userInfo}>
                {userData.gender === 'male' ? '男' : '女'} · 
                {userData.height && userData.weight ? 
                  ` ${userData.height}cm · ${userData.weight}kg` : 
                  ' 未完善身体数据'}
              </p>
            </div>
            <button
              onClick={() => handleNavigation('/profile/edit')}
              className={styles.editButton}
            >
              编辑资料
            </button>
          </div>
        </div>

        {/* 运动数据 */}
        <div className={styles.statsCard}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <p className={styles.statValue}>{stats.totalMinutes}</p>
              <p className={styles.statLabel}>总运动时长(分钟)</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statValue}>{stats.todayMinutes}</p>
              <p className={styles.statLabel}>今日运动时长(分钟)</p>
            </div>
          </div>
        </div>

        {/* 菜单部分 */}
        <div className={styles.menuCard}>
          <div 
            className={styles.menuItem}
            onClick={() => handleNavigation('/settings')}
          >
            <div className={styles.menuIcon}>
              <div className={styles.iconCircle}>
                <FaCog className={styles.iconInner} />
              </div>
              <span>设置</span>
            </div>
            <FaChevronRight className={styles.chevronIcon} size={14} />
          </div>

          <div 
            className={styles.menuItem}
            onClick={() => handleNavigation('/workout/plan')}
          >
            <div className={styles.menuIcon}>
              <div className={styles.iconCircle}>
                <GiHealthNormal className={styles.iconInner} />
              </div>
              <span>健身档案</span>
            </div>
            <FaChevronRight className={styles.chevronIcon} size={14} />
          </div>

          <div 
            className={styles.menuItem}
            onClick={() => handleNavigation('/favorites')}
          >
            <div className={styles.menuIcon}>
              <div className={styles.iconCircle}>
                <FaHeart className={styles.iconInner} />
              </div>
              <span>我的收藏</span>
            </div>
            <FaChevronRight className={styles.chevronIcon} size={14} />
          </div>

          <div 
            className={styles.menuItem}
            onClick={() => handleNavigation('/help')}
          >
            <div className={styles.menuIcon}>
              <div className={styles.iconCircle}>
                <FaQuestion className={styles.iconInner} />
              </div>
              <span>帮助与反馈</span>
            </div>
            <FaChevronRight className={styles.chevronIcon} size={14} />
          </div>

          <div 
            className={styles.menuItem}
            onClick={() => handleNavigation('/update')}
          >
            <div className={styles.menuIcon}>
              <div className={styles.iconCircle}>
                <FaSync className={styles.iconInner} />
              </div>
              <span>检查更新</span>
            </div>
            <FaChevronRight className={styles.chevronIcon} size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}; 