'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {  FaSpinner } from 'react-icons/fa';
import './WorkoutPlanPage.css';
import { Select } from 'antd';

interface WorkoutPlanPageProps {}


interface PlanData {
  goal: string; 
  plan: string;
}


export const WorkoutPlanPage: React.FC<WorkoutPlanPageProps> = () => {
  const router = useRouter();
  const [goal, setGoal] = useState('reducingFat');
  const [workoutDays, setWorkoutDays] = useState(3);
  const [workoutTime, setWorkoutTime] = useState(30);
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [equipmentAccess, setEquipmentAccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const goalOptions = {
    reducingFat:'减脂',
    buildMuscles:'增肌',
    improvedEndurance:'提高耐力',
    enhanceCoreStrength : '增强核心力量',
  }

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  // 获取当前健身方案
  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/workout/plan', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        setCurrentPlan(response.data.data);
      }
    } catch (error) {
      console.log('获取健身方案失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成健身方案
  const handleGeneratePlan = async () => {
    if (!goal || generating) return;

    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        '/api/workout/plan',
        {
          goal,
          workoutDays,
          workoutTime,
          fitnessLevel,
          equipmentAccess,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCurrentPlan(response.data.data);
      }
    } catch (error) {
      console.log('生成健身方案失败:', error);
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="page-container">
      <div className="content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : currentPlan ? (
          <div className="plan-card">
            <h2 className="plan-title">您的健身方案</h2>
            <div className="plan-container">
              <span className="plan-goal-tag">
                {goalOptions[currentPlan.goal]}
              </span>
              <div className='planContent'>
            <p className="plan-text">{currentPlan.plan}</p>
          </div>
            </div>
            <div className='new-plan-button-container'>
            <button
              onClick={() => setCurrentPlan(null)}
              className="new-plan-button"
            >
              生成新方案
            </button>
            </div>
          </div>
        ) : (
          <>
            <div className="plan-card">
              <h2 className="form-title">生成个性化健身方案</h2>
              <p className="form-description">
                请回答以下问题，AI将为您生成适合的健身方案。
              </p>

              <div className="form-space">
                <div className="form-group">
                  <div className="form-label">
                    您的健身目标是什么？
                  </div>
                  <Select
                    id="goal"
                    style={{width:'100%'}}
                    value={goal}
                    onChange={(value: string) => setGoal(value)}
                    options={[
                      { value: 'reducingFat', label: '减脂' },
                      { value: 'buildMuscles', label: '增肌' },
                      { value: 'improvedEndurance', label: '提高耐力' },
                      { value: 'enhanceCoreStrength', label: '增强核心力量' },
                    ]}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">
                    每周计划锻炼几天？
                  </div>
                  <Select
                    value={workoutDays}
                    style={{width:'100%'}}
                    onChange={(value: number) => setWorkoutDays(value)}
                    options={[
                      { value: 2, label: '2天' },
                      { value: 3, label: '3天' },
                      { value: 4, label: '4天' },
                      { value: 5, label: '5天' },
                      { value: 6, label: '6天' },
                    ]}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">
                    每次锻炼时长？
                  </div>
                  <Select
                    value={workoutTime}
                    style={{width:'100%'}}
                    onChange={(value: number) => setWorkoutTime(value)}
                    options={[
                      { value: 15, label: '15分钟' },
                      { value: 30, label: '30分钟' },
                      { value: 45, label: '45分钟' },
                      { value: 60, label: '60分钟' },
                      { value: 90, label: '90分钟' },
                    ]}
                  />
                </div>

                <div className="form-group">
                  <div className="form-label">
                    您的健身水平？
                  </div>
                  <Select
                    style={{width:'100%'}}
                    value={fitnessLevel}
                    onChange={(value: string) => setFitnessLevel(value)}
                    options={[
                      { value: 'beginner', label: '初学者' },
                      { value: 'intermediate', label: '中等水平' },
                      { value: 'advanced', label: '高级水平' },
                    ]}
                  />
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="equipmentAccess"
                    checked={equipmentAccess}
                    onChange={(e) => setEquipmentAccess(e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="equipmentAccess" className="checkbox-label">
                    是否有健身器材（如哑铃、弹力带等）
                  </label>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={!goal || generating}
                className="submit-button"
              >
                {generating ? (
                  <div className="loading-text">
                    <FaSpinner className="loading-icon" size={16} />
                    <span>生成中...</span>
                  </div>
                ) : (
                  '生成健身方案'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 