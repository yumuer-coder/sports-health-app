'use client';

import React, { ReactNode } from 'react';
import styles from './BottomNavbar.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface BottomNavbarProps {
  activeTab: string;
  items: NavItem[];
  onChange: (id: string) => void;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeTab,
  items,
  onChange,
}) => {
  return (
    <div className={styles.navbar}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navItem} ${
            activeTab === item.id
              ? styles.activeItem
              : styles.inactiveItem
          }`}
          onClick={() => onChange(item.id)}
        >
          <div className={styles.icon}>{item.icon}</div>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}; 