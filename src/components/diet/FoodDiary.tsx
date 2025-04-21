'use client';

import React, { useState } from 'react';
import http from '@/lib/axios';
import { FaTrash } from 'react-icons/fa';
import styles from './FoodDiary.module.css';
import toast from 'react-hot-toast';
interface FoodEntry {
  id: number;
  foodId: number;
  mealType: string;
  quantity: number;
  date: string;
  food: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    unit: string;
  };
}

interface FoodDiaryProps {
  entries: FoodEntry[];
  onRefresh: () => void;
}

export const FoodDiary: React.FC<FoodDiaryProps> = ({ entries, onRefresh }) => {
  const [deleting, setDeleting] = useState<number | null>(null);

  const getMealTypeLabel = (mealType: string): string => {
    const mealTypes: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return mealTypes[mealType] || mealType;
  };

  const handleDelete = async (entryId: number) => {
    try {
      setDeleting(entryId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await http.delete(`/api/diet/${entryId}`);

      if (response.data.success) {
        onRefresh();
      }
    } catch (error: any) {
      console.log('删除饮食记录失败:', error);
      toast.error(error.message || '删除饮食记录失败');
    } finally {
      setDeleting(null);
    }
  };

  // 按食品类型分组
  const groupedEntries: Record<string, FoodEntry[]> = {};
  entries.forEach((entry) => {
    if (!groupedEntries[entry.mealType]) {
      groupedEntries[entry.mealType] = [];
    }
    groupedEntries[entry.mealType].push(entry);
  });

  // 按逻辑顺序对饮食类型进行排序
  const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sortedMealTypes = Object.keys(groupedEntries).sort(
    (a, b) => mealTypeOrder.indexOf(a) - mealTypeOrder.indexOf(b)
  );

  return (
    <div className={styles.diaryContainer}>
      {sortedMealTypes.length > 0 ? (
        sortedMealTypes.map((mealType) => (
          <div key={mealType} className={styles.mealSection}>
            <div className={styles.mealHeader}>
              <h3 className={styles.mealTitle}>{getMealTypeLabel(mealType)}</h3>
            </div>
            <div>
              {groupedEntries[mealType].map((entry) => (
                <div
                  key={entry.id}
                  className={styles.entryItem}
                >
                  <div className={styles.entryInfo}>
                    <h4 className={styles.foodName}>{entry.food.name}</h4>
                    <p className={styles.foodDetails}>
                      {entry.quantity} {entry.food.unit} · {Math.round(entry.food.calories * entry.quantity)} 大卡
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className={styles.deleteButton}
                    aria-label="删除"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>今日暂无饮食记录</p>
          <p className={styles.emptyHint}>点击右下角加号按钮添加食物</p>
        </div>
      )}
    </div>
  );
}; 