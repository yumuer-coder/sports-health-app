'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import styles from './login.module.css';
import { EyeOutline,EyeInvisibleOutline } from 'antd-mobile-icons'
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 用于控制密码显示模式

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 客户端基本验证
    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    // 正则验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('请输入有效的手机号');
      return;
    }

    if (password.length < 6 || password.length > 8) {
      setError('密码长度应在6到8个字符之间');
      return;
    }

    if (password.includes(' ')) {
      setError('密码不能包含空格');
      return;
    }

    setLoading(true);

    try {
      // 发送登录请求到服务器
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, password }),
      });
      
      // 检查响应的内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // 如果不是JSON响应，可能是服务器错误
        console.log('服务器返回了非JSON响应');
        console.log('Status:', response.status, response.statusText);
        // 尝试获取响应文本进行调试
        const responseText = await response.text();
        console.log('Response text:', responseText);
        setError('服务器错误，请稍后再试');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 显示来自服务器的错误消息
        setError(data.message || '登录失败，请稍后再试');
        setLoading(false);
        return;
      }

      // 登录成功，保存token和用户信息
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userId', data.data.userId);
      localStorage.setItem('role', data.data.role);

      // 如果是首次登录，跳转到完善信息页面
      if (data.data.isFirstLogin) {
        router.push('/profile/complete');
      } else {
        // 否则跳转到首页
        router.push('/');
      }
    } catch (err: any) {
      console.log('登录请求失败:', err);
      setError('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    if (newPassword.length <= 8) {
      setPassword(newPassword);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logoCircle}>
              <FiUser className={styles.logoIcon} />
            </div>
            <h1 className={styles.title}>AI健身App</h1>
            <p className={styles.subtitle}>登录您的账户</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorContainer}>
                <FiAlertCircle className={styles.errorIcon} />
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.label}>
                手机号
              </label>
              <div className={styles.inputGroup}>
                <FiUser className={styles.inputIcon} />
                <input
                  id="phoneNumber"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={styles.input}
                  placeholder="请输入手机号"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                密码
              </label>
              <div className={styles.inputGroup}>
                <FiLock className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="请输入密码"
                  autoComplete="current-password"
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
              <div className={styles.forgotPassword}>
                <Link href="/forgot-password" className={styles.link}>
                  忘记密码?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className={styles.spinner} />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className={styles.registerContainer}>
            <p className={styles.registerText}>
              还没有账户?{' '}
              <Link href="/register" className={styles.link}>
                立即注册
              </Link>
            </p>
          </div>

          <div className={styles.footer}>
            <p>AI健身App &copy; {new Date().getFullYear()} - 健康生活从这里开始</p>
          </div>
        </div>
      </div>
    </div>
  );
} 