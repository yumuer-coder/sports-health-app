'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import styles from './complete.module.css';

export default function CompleteProfile() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthday: '',
    height: '',
    weight: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  // 生成今天和1900年1月1日的日期字符串，用于限制生日输入
  const today = new Date().toLocaleDateString().replace(/\//g, '-');
  const minDate = '1900-01-01';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    // 添加输入验证
    if (name === 'name' && value.length > 16) {
      return; // 昵称最多16个字符
    }
    
    if (name === 'height') {
      const height = parseInt(value);
      if (height < 0 || height > 300) {
        return; // 身高限制在0-300之间
      }
      value = height.toString();
    }
    
    if (name === 'weight') {
      const weight = parseInt(value,10);
      if (weight < 0 || weight > 500) {
        return; // 体重限制在0-500之间
      }
      value = weight.toString();
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(current => current - 1);
      setError('');
    }
  };

  const handleNextStep = () => {
    // 验证当前步骤的数据
    if (currentStep === 1) {
      if (!formData.name) {
        setError('请输入昵称');
        return;
      }
      
      if (formData.name.length < 1 || formData.name.length > 16) {
        setError('昵称长度应在1~16个字符之间');
        return;
      }
    }
    
    if (currentStep === 2 && !formData.gender) {
      setError('请选择性别');
      return;
    }
    
    if (currentStep === 3 && !formData.birthday) {
      setError('请选择出生日期');
      return;
    }
    
    if (currentStep === 4) {
      if (!formData.height) {
        setError('请输入身高');
        return;
      }
      
      if (!formData.weight) {
        setError('请输入体重');
        return;
      }
      
      const height = parseInt(formData.height);
      const weight = parseInt(formData.weight);
      
      if (isNaN(height) || height <= 0 || height > 300) {
        setError('身高应为0到300之间的整数');
        return;
      }
      
      if (isNaN(weight) || weight <= 0 || weight > 500) {
        setError('体重应为0到500之间的整数');
        return;
      }
      
      handleSubmit();
      return;
    }
    
    setError('');
    setCurrentStep(current => current + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        router.push('/login');
        return;
      }
      
      // 由于中间件在Edge运行时中无法验证JWT，我们直接访问API，并在请求体中传递用户ID
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: Number(userId), // 显式传递用户ID
          name: formData.name,
          gender: formData.gender,
          birthday: formData.birthday,
          height: Number(formData.height),
          weight: Number(formData.weight),
          isFirstLogin: false
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新失败');
      }
      
      // 更新完成后重定向到主页
      router.push('/workout');
      
    } catch (err:any) {
      console.log('提交信息失败:', err);
      setError(err.message||'提交信息失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>完善个人信息</h1>
        <div className={styles.progress}>{currentStep}/{totalSteps}</div>
      </div>

      <div className={styles.stepsContainer}>
        <div className={styles.steps}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`${styles.step} ${currentStep > i ? styles.completed : ''} ${currentStep === i + 1 ? styles.current : ''}`}
            >
              <div className={styles.stepCircle}>{i + 1}</div>
              <div className={styles.stepName}>
                {i === 0 && '昵称'}
                {i === 1 && '性别'}
                {i === 2 && '生日'}
                {i === 3 && '体型'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formContainer}>
        {currentStep === 1 && (
          <div className={styles.formStep}>
            <h2 className={styles.stepTitle}>请输入您的昵称</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>昵称</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="请输入昵称（1-16个字符）"
                minLength={1}
                maxLength={16}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.formStep}>
            <h2 className={styles.stepTitle}>请选择您的性别</h2>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioLabel} ${formData.gender === '男' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="男"
                  checked={formData.gender === '男'}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>男</span>
              </label>
              <label className={`${styles.radioLabel} ${formData.gender === '女' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="女"
                  checked={formData.gender === '女'}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>女</span>
              </label>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.formStep}>
            <h2 className={styles.stepTitle}>请选择您的出生日期</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="birthday" className={styles.label}>出生日期</label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                className={styles.input}
                max={today}
                min={minDate}
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.formStep}>
            <h2 className={styles.stepTitle}>请输入您的身高体重</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="height" className={styles.label}>身高 (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                className={styles.input}
                placeholder="请输入身高"
                step="1"
                min="0"
                max="300"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="weight" className={styles.label}>体重 (kg)</label>
              <input
                id="weight"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                className={styles.input}
                placeholder="请输入体重"
                min="0"
                max="500"
              />
            </div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttonContainer}>
          {currentStep > 1 && (
            <button
              className={`${styles.button} ${styles.prevButton}`}
              onClick={handlePrevStep}
              disabled={loading}
            >
              <FiArrowLeft className={styles.buttonIcon} /> 上一步
            </button>
          )}
          
          <button
            className={`${styles.button} ${styles.nextButton} ${currentStep === 1 ? styles.fullWidth : ''}`}
            onClick={handleNextStep}
            disabled={loading}
          >
            {currentStep === totalSteps ? '完成' : '下一步'}
            {!loading && currentStep !== totalSteps && <FiArrowRight className={styles.buttonIcon} />}
          </button>
        </div>
      </div>
    </div>
  );
} 