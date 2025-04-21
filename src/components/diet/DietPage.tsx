'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import http from '@/lib/axios';
import { FaCalendarAlt } from 'react-icons/fa';
import { AiChatButton } from '@/components/ui/AiChatButton';
import styles from './DietPage.module.css';
import BarChart from './BarChart';
import toast from 'react-hot-toast';
import { foodTranslations, MealType } from '@/types/diet';

interface DietEntry {
  id: number;
  mealType: string;
  date: string;
  totalCalories: number;
  items: DietItem[];
}

interface DietItem {
  id: number;
  foodId: number;
  quantity: number;
  calories: number;
  food: {
    id: number;
    name: string;
    unit: string;
    calories: number;
  };
}

interface CaloriesData {
  date: string;
  day: string;
  value: number;
}

export const DietPage = () => {
  const router = useRouter();
  const [dietData, setDietData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState<CaloriesData[]>([]);

  useEffect(() => {
    fetchDietData();
    fetchWeeklyData();
  }, [date]);

  const fetchDietData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const dateStr = date.toLocaleDateString().replace(/\//g, '-');
      
      const response = await http.get(`/api/diet?date=${dateStr}`);

      if (response.data.success) {
        setDietData(response.data.data);
      }
    } catch (error: any) {
      console.log('获取饮食数据失败:', error);
      toast.error(error.message || '获取饮食数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return
      };

      // 获取7天内的饮食数据
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // 7天中包括今天
      
      const response = await http.get(
        `/api/diet/weekly?startDate=${startDate.toLocaleDateString()}&endDate=${endDate.toLocaleDateString()}`);

      if (response.data.success) {
        setWeeklyData(response.data.data || []);
      }
    } catch (error: any) {
      console.log('获取周饮食数据错误:', error);
      toast.error(error.message || '获取周饮食数据错误');
    }
  };

  const formatDate = (date: Date): string => { 
    return date.toLocaleDateString().replace(/\//g, '-');
  };

  const handleAddFood = () => {
    router.push('/diet/add');
  };

  const translateMealType = (mealType: string): string => {
    
    return foodTranslations[mealType] || mealType;
  };

  if (loading && !dietData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  const mealTypeEntries: { [key: string]: DietEntry } = {};
  
  if (dietData && dietData.entries) {
    dietData.entries.forEach((entry: DietEntry) => {
      mealTypeEntries[entry.mealType] = entry;
    });
  }

  const mealTypeCalories = dietData?.summary?.mealTypeCalories || { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

  return (
    <div className={styles.container}>
      <div className={styles.dateHeader}>
        <h2 className={styles.dateTitle}>今日热量摄入</h2>
        <div className={styles.dateDisplay}>
          <FaCalendarAlt className={styles.calendarIcon} />
          <span>{formatDate(date)}</span>
        </div>
      </div>

      {/* 早中晚餐卡片部分 */}
      {MealType.map(mealType => (
        <div key={mealType} className={styles.mealCard}>
          <div className={styles.mealHeader}>
            <h3 className={styles.mealTitle}>{translateMealType(mealType)}</h3>
            <span className={styles.mealCalories}>{mealTypeCalories[mealType]} 大卡</span>
          </div>
          
          {mealTypeEntries[mealType] && mealTypeEntries[mealType].items && mealTypeEntries[mealType].items.length > 0 ? (
            <div className={styles.foodList}>
              {mealTypeEntries[mealType].items.map((item: DietItem) => (
                <div key={item.id} className={styles.foodItem}>
                  <div className={styles.foodInfo}>
                    <span className={styles.foodName}>{item.food.name}</span>
                    <span className={styles.foodQuantity}>
                      {item.quantity} * {item.food.unit} - {item.calories}大卡
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMeal}>
              <p>还没有添加{translateMealType(mealType)}的食物记录</p>
            </div>
          )}
        </div>
      ))}

      <div className={styles.addButtonContainer}>
        <button
          onClick={handleAddFood}
          className={styles.addButton}
          aria-label="添加食物"
        >
          <span>+ 添加食物</span>
        </button>
      </div>

      {/* 图表 */}
      {weeklyData.length > 0 && (
        <div className={styles.weeklyChart}>
          <h3 className={styles.chartTitle}>热量摄入趋势 (单位：大卡)</h3>
          <div>
            <BarChart data={weeklyData} />
          </div>
        </div>
      )}

      <AiChatButton />
    </div>
  );
}; 