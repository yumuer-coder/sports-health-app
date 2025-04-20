'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import styles from './forgot-password.module.css';
import { EyeOutline,EyeInvisibleOutline } from 'antd-mobile-icons'


export default function ForgotPassword() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false); // 用于控制密码显示模式
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!phoneNumber) {
      newErrors.phoneNumber = '请输入手机号码';
    } else if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      newErrors.phoneNumber = '请输入有效的手机号码';
    }
    
    if (!verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    }
    
    if (!password) {
      newErrors.password = '请输入新密码';
    } else if (password.length < 6 || password.length > 8) {
      newErrors.password = '密码长度应为6-8位';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setErrors({ ...errors, phoneNumber: '请输入有效的手机号码' });
      return;
    }

    try {
      setIsLoading(true);
      
      // 先检查手机号是否已注册
      const checkUserRes = await axios.get(`/api/auth/check-user?phoneNumber=${phoneNumber}`);
      
      if (!checkUserRes.data.exists) {
        setMessage({ type: 'error', content: '该手机号尚未注册' });
        setIsLoading(false);
        return;
      }
      
      // 发送验证码
      const response = await axios.get(`/api/auth/reset-password?phoneNumber=${phoneNumber}`);
      
      if (response.data.success) {
        setMessage({ type: 'success', content: '验证码已发送' });
        setCountdown(60);
      } else {
        setMessage({ type: 'error', content: response.data.message || '发送验证码失败' });
      }
    } catch (error) {
      console.log('发送验证码失败:', error);
      setMessage({ type: 'error', content: '发送验证码失败，请稍后再试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', content: '' });
      
      const response = await axios.post('/api/auth/reset-password', {
        phoneNumber,
        verificationCode,
        password,
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', content: '密码重置成功！' });
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setMessage({ type: 'error', content: response.data.message || '密码重置失败' });
      }
    } catch (error: any) {
      console.log('密码重置失败:', error);
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.message || '密码重置失败，请稍后再试' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles['page-container']}>
      <div className={styles['form-container']}>
        <div className={styles['header']  }>
          <h2 className={styles['page-title']}>重置密码</h2>
          <p className={styles['login-link']}>
            <Link href="/login">
              返回登录
            </Link>
          </p>
        </div>
        
        {message.content && (
          <div className={`${styles.message} ${message.type === 'error' ? styles['error-message'] : styles['success-message']}`}>
            {message.content}
          </div>
        )}
        
        <form className={styles['form']} onSubmit={handleSubmit}>
          <div className={styles['shadow-container']}>
            <div className={styles['form-group']}>
              <label htmlFor="phoneNumber" className={styles['form-label']}>
                手机号码
              </label>
              <div className={styles['input-container']}>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={styles['form-input']}
                  placeholder="请输入手机号码"
                />
                {errors.phoneNumber && (
                  <p className={styles['error-text']}>{errors.phoneNumber}</p>
                )}
              </div>
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="verificationCode" className={styles['form-label']}>
                验证码
              </label>
              <div className={styles['verification-container']}>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  style={{border:' 1px solid #d1d5db',borderRadius:'0.375rem 0 0 0.375rem',paddingLeft: '0.75rem',width:'60%'}}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0 || isLoading}
                  className={styles['verification-button']}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </button>
              </div>
              {errors.verificationCode && (
                <p className={styles['error-text']}>{errors.verificationCode}</p>
              )}
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="password" className={styles['form-label']}>
                新密码
              </label>
              <div className={styles['input-container']}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles['form-input']}
                  placeholder="请输入6-8位新密码"
                />
                <div
                  className={styles.togglePasswordButton}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeInvisibleOutline />
                  ) : (
                    <EyeOutline />
                  )}
                </div>
                {errors.password && (
                  <p className={styles['error-text']}>{errors.password}</p>
                )}
              </div>
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="confirmPassword" className={styles['form-label']}>
                确认新密码
              </label>
              <div className={styles['input-container']}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles['form-input']}
                  placeholder="请再次输入新密码"
                />
                <div
                  className={styles.togglePasswordButton}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeInvisibleOutline />
                  ) : (
                    <EyeOutline />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className={styles['error-text']}>{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles['submit-button']}
          >
            {isLoading ? '处理中...' : '重置密码'}
          </button>
        </form>
      </div>
    </div>
  );
}

