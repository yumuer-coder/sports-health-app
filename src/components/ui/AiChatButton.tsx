'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaRobot } from 'react-icons/fa';
import { AiChatModal } from './AiChatModal';
import styles from './AiChatButton.module.css';

export const AiChatButton = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={styles.chatButtonContainer}>
        <button
          onClick={openModal}
          className={styles.chatButton}
          aria-label="AI智能助手"
        >
          <FaRobot size={24} />
        </button>
      </div>

      {isModalOpen && <AiChatModal onClose={closeModal} />}
    </>
  );
}; 