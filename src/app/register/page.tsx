'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicAxios } from '@/lib/axios';
import styles from './register.module.css';
import toast from 'react-hot-toast';
import { EyeOutline,EyeInvisibleOutline } from 'antd-mobile-icons'

export default function RegisterPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 用于控制密码显示模式

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('请输入手机号');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('请输入有效的手机号码');
      return;
    }

    try {
      setCodeSending(true);
      setError('');
      
      const response = await publicAxios.get(`/api/auth/register?phoneNumber=${phoneNumber}`);
      
      if (response.data.success) {
        // 验证码重发倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.message || '发送验证码失败');
      }
    } catch (error: any) {
      setError(error.message || '发送验证码失败，请稍后再试');
    } finally {
      setCodeSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !password || !confirmPassword || !verificationCode) {
      setError('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6||password.length >8) {
      setError('密码长度6-8个字符之间');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await publicAxios.post('/api/auth/register', {
        phoneNumber,
        password,
        verificationCode,
      });
      
      if (response.data.success) {
        toast.success('注册成功');
        router.push('/login?registered=true');
      } else {
        setError(response.data.message || '注册失败');
      }
    } catch (error: any) {
      setError(error.message || '注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.headerContainer}>
          <h1 className={styles.title}>注册账号</h1>
        </div>
        
        {error && (
          <div className={styles.errorContainer}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber" className={styles.label}>
              手机号
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="请输入手机号"
              className={styles.input}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="verificationCode" className={styles.label}>
              验证码
            </label>
            <div className={styles.verificationContainer}>
              <input
                id="verificationCode"
                type="text"
                placeholder="请输入验证码"
                className={styles.input}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || codeSending}
                className={styles.verificationButton}
              >
                {countdown > 0 ? `${countdown}秒后重发` : codeSending ? '发送中...' : '获取验证码'}
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              密码
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="请设置密码"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              确认密码
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="请再次输入密码"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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
          </div>
          
          <button
            type="submit"
            className={styles.registerButton}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div className={styles.loginContainer}>
          <p className={styles.loginText}>
            已有账号?{' '}
            <Link href="/login" className={styles.link}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 