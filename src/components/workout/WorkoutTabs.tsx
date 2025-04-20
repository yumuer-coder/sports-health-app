'use client';

import React, { useState, useEffect } from 'react';
import { WorkoutHome } from './WorkoutHome';
import { WorkoutList } from './WorkoutList';
import { YogaList } from './YogaList';
import styles from './WorkoutTabs.module.css';
import { workoutTabs } from '@/types/workout';

export const WorkoutTabs = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole === 'admin') {
      setIsAdmin(true);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI健身助手</h1>
      </div>

      {/* Tab导航栏 */}
      <div className={styles.tabBar}>
        <div className={styles.tabsContainer}>
          {workoutTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.activeTab : styles.inactiveTab
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab内容部分 */}
      <div className={styles.content}>
        {activeTab === 'home' && <WorkoutHome isAdmin={isAdmin} />}
        {activeTab === 'workout' && <WorkoutList type="workout" />}
        {activeTab === 'yoga' && <YogaList type="yoga" />}
      </div>
    </div>
  );
}; 