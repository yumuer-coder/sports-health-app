'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import styles from './AiChatModal.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AiChatModalProps {
  onClose: () => void;
}

export const AiChatModal: React.FC<AiChatModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '您好！我是您的AI健身助手。请问有什么关于健身、营养或健康生活方式的问题？',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 消息更改时滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const generateQuickQuestions = () => {
    return [
      '如何增肌减脂？',
      '健康饮食建议',
      '运动后吃什么好？',
      '蛋白质摄入量',
    ];
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setCurrentResponse('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 为AI响应创建占位信息
      const aiMessageId = (Date.now() + 1).toString();

      // 流式输出
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: input.trim() })
      });

      if (!response.ok) {
        throw new Error('获取AI响应失败');
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      // 读取流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        setCurrentResponse(responseText);
      }

      // 流式响应完成后，将完整消息添加到消息数组中
      setMessages(prev => [...prev, {
        id: aiMessageId,
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      }]);
      setCurrentResponse('');
    } catch (error) {
      console.log('获取AI响应失败:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '抱歉，我暂时无法回答，请稍后再试。',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* 头部 */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>AI智能助手</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="关闭"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* 消息部分 */}
        <div className={styles.messagesContainer}>
          <div className={styles.messagesWrapper}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${
                  message.sender === 'user' ? styles.messageRowUser : styles.messageRowAi
                }`}
              >
                <div
                  className={`${styles.messageBubble} ${
                    message.sender === 'user'
                      ? styles.userBubble
                      : styles.aiBubble
                  }`}
                >
                  <p className={styles.messageText}>{message.text}</p>
                </div>
              </div>
            ))}
            {currentResponse && (
              <div className={styles.messageRow}>
                <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                  <p className={styles.messageText}>{currentResponse}</p>
                </div>
              </div>
            )}
            {loading && !currentResponse && (
              <div className={styles.messageRow}>
                <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                  <div className={styles.loadingIndicator}>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
        </div>

        {/* 常见问题 */}
        {messages.length < 3 && (
          <div className={styles.quickQuestionsContainer}>
            <p className={styles.quickQuestionsTitle}>常见问题：</p>
            <div className={styles.quickQuestionsGrid}>
              {generateQuickQuestions().map((question) => (
                <button
                  key={question}
                  onClick={() => handleQuickQuestion(question)}
                  className={styles.quickQuestionButton}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入框 */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入您的问题..."
              className={styles.textInput}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={styles.sendButton}
              aria-label="发送"
            >
              <FaPaperPlane size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 