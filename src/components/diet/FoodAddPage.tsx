'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaMinus, FaPlus } from 'react-icons/fa';
import styles from './FoodAddPage.module.css';
import Image from 'next/image';
import { mealTypeWithLabel, categoryTranslations } from '@/types/diet';

interface Food {
  id: number;
  name: string;
  category: string;
  calories: number;
  unit: string;
  image: string | null;
}

interface GroupedFoods {
  [category: string]: Food[];
}

export const FoodAddPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('lunch');
  const [selectedFoods, setSelectedFoods] = useState<{ [key: number]: { food: Food, quantity: number } }>({});
  const [adding, setAdding] = useState(false);
  const [groupedFoods, setGroupedFoods] = useState<GroupedFoods>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAllFoods();
  }, []);

  const fetchAllFoods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/foods?groupByCategory=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setGroupedFoods(response.data.data);
        setCategories(Object.keys(response.data.data).filter(cat => 
          response.data.data[cat].length > 0
        ));
      }
    } catch (error) {
      console.log('获取食品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (food: Food, delta: number) => {
    setSelectedFoods(prev => {
      // 如果没有选择食物，什么都不做
      if (!prev[food.id] && delta < 0) return prev;
      
      // 如果在选中的食物中，要更新数量
      if (prev[food.id]) {
        const newQuantity = Math.max(0, prev[food.id].quantity + delta);
        
        // 如果数量为0，则删除该食品
        if (newQuantity === 0) {
          const updated = { ...prev };
          delete updated[food.id];
          return updated;
        }
        
        // 否则更新数量
        return {
          ...prev,
          [food.id]: {
            ...prev[food.id],
            quantity: newQuantity
          }
        };
      }
      
      // 如果不是在选中的食物中，且在增加数量，则添加1
      return {
        ...prev,
        [food.id]: { food, quantity: 1 }
      };
    });
  };

  const getQuantity = (foodId: number): number => {
    return selectedFoods[foodId]?.quantity || 0;
  };

  const calculateTotalCalories = () => {
    return Object.values(selectedFoods).reduce((total, item) => {
      return total + item.food.calories * item.quantity;
    }, 0);
  };

  const handleAddFood = async () => {
    if (Object.keys(selectedFoods).length === 0 || adding) return;

    try {
      setAdding(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const items = Object.values(selectedFoods).map(item => ({
        foodId: item.food.id,
        quantity: item.quantity
      }));

      const response = await axios.post(
        '/api/diet',
        {
          mealType: selectedTab,
          items,
          date: new Date().toLocaleString()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        router.push('/diet');
      }
    } catch (error) {
      console.log('添加饮食记录失败:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>添加食物</h1>
      </div>

      {/* 早中晚餐Tabs */}
      <div className={styles.tabsContainer}>
        {mealTypeWithLabel.map(meal => (
          <button
            key={meal.id}
            className={`${styles.tabButton} ${selectedTab === meal.id ? styles.activeTab : ''}`}
            onClick={() => setSelectedTab(meal.id)}
          >
            {meal.label}
          </button>
        ))}
      </div>

      {/* 食品展示部分 */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      ) : (
        <div className={styles.foodCategoriesContainer}>
          {categories.map(category => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                {categoryTranslations[category] || category}
              </h2>
              <div className={styles.foodsList}>
                {groupedFoods[category].map(food => (
                  <div key={food.id} className={styles.foodItem}>
                    <div className={styles.foodImageContainer}>
                      {food.image && (
                        <Image
                          src={food.image}
                          alt={food.name}
                          width={50}
                          height={50}
                          className={styles.foodImage}
                        />
                      )}
                      {!food.image && (
                        <div className={styles.placeholderImage}>
                          {food.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={styles.foodInfo}>
                      <h3 className={styles.foodName}>{food.name}</h3>
                      <p className={styles.foodDetail}>
                        {food.unit} - {food.calories}大卡
                      </p>
                    </div>
                    <div className={styles.quantityControl}>
                      <button 
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(food, -1)}
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className={styles.quantityText}>{getQuantity(food.id)}</span>
                      <button 
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(food, 1)}
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(selectedFoods).length > 0 && (
        <div className={styles.footer}>
          <div className={styles.totalCalories}>
            总计: {calculateTotalCalories()}大卡
          </div>
          <button
            onClick={handleAddFood}
            disabled={adding}
            className={styles.confirmButton}
          >
            {adding ? '添加中...' : '确认'}
          </button>
        </div>
      )}
    </div>
  );
}; 