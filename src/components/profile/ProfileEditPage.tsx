'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { Form, Input, Select, DatePicker, Button, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { FaCamera } from 'react-icons/fa';
import styles from './ProfileEditPage.module.css';

interface ProfileEditPageProps {
  userData: any;
}


export const ProfileEditPage: React.FC<ProfileEditPageProps> = ({ userData }) => {
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [form] = Form.useForm();


  useEffect(() => {
    if (userData) {
      form.setFieldsValue({...userData,birthday: userData.birthday ? dayjs(userData.birthday) : undefined})
      setAvatarPreview(userData.avatar || '');

      // 计算BMI
      if (userData.height && userData.weight) {
        const heightInMeters = userData.height / 100;
        const bmiValue = Number((userData.weight / (heightInMeters * heightInMeters)).toFixed(1));
        setBmi(bmiValue);
      }
    }
  }, [userData]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('图片大小不能超过1.5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const onFinish = async (values: any) => {

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let avatarUrl = userData?.avatar || '';

      // 如果头像更新，则上传头像
      if (avatarFile) {
        const formDataForUpload = new FormData();
        formDataForUpload.append('file', avatarFile);
        
        const uploadResponse = await axios.post('/api/avatar', formDataForUpload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (uploadResponse.data.success) {
          avatarUrl = uploadResponse.data.url;
        }
      }

      const updateResponse = await axios.put(
        '/api/user/profile',
        {
          ...values,
          userId:userData.id,
          birthday:(new Date(values.birthday).toLocaleString()),
          avatar: avatarUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (updateResponse.data.success) {
        router.push('/profile');
      }
    } catch (error) {
      console.log('更新用户信息失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const getBmiCategory = (bmi: number): string => {
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '正常';
    if (bmi < 28) return '偏胖';
    return '肥胖';
  };

  const getBmiCategoryClass = (bmi: number): string => {
    if (bmi < 18.5) return 'category-thin';
    if (bmi < 24) return 'category-normal';
    if (bmi < 28) return 'category-overweight';
    return 'category-obese';
  };


  return (
    <div className={styles["page-container"]}>
      {/* 头部 */}
      <div className={styles["header"]}>
        <h1 className={styles["page-title"]}>编辑个人资料</h1>
      </div>

      <div className={styles["content-container"]}>
        <div className={styles["profile-card"]}>
          {/* 头像 */}
          <div className={styles["avatar-container"]}>
            <div className={styles["avatar-wrapper"]}>
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles["default-avatar"]}>
                  <span className={styles["avatar-letter"]}>
                    {userData?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <label className={styles["avatar-edit-button"]}>
                <FaCamera className={styles["camera-icon"]} size={12} />
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleAvatarChange}
                  className={styles["avatar-input"]}
                />
              </label>
            </div>
            <div className={styles["change-avatar-button"]}>更换头像</div>
          </div>

        <Form
          form={form}
          name="user_form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="昵称"
            name="name"
            rules={[{ required: true, message: '请输入昵称!' }]}
          >
            <Input placeholder="请输入昵称" maxLength={16} />
          </Form.Item>

          <Form.Item
            label="身高 (cm)"
            name="height"
            rules={[
              { required: true, message: '请输入身高!' },
            ]}
          >
            <InputNumber<number>
              min={50} max={300} style={{width:'100%'}}
              formatter={(value) => {
                // 确保只显示整数部分
                if (value === null || value === undefined) return '';
                return Math.floor(value).toString(); // 强制转换为整数并返回字符串
              }}
              parser={(value) => {
                // 移除所有非数字字符，并返回整数值
                if (!value) return 0;
                const parsedValue = parseInt(value.replace(/\D/g, ''), 10); // 只保留数字部分
                return isNaN(parsedValue) ? 0 : parsedValue; // 如果解析失败，返回 0
              }}
            />
          </Form.Item>

          <Form.Item
            label="体重 (kg)"
            name="weight"
            rules={[
              { required: true, message: '请输入体重!' },
            ]}
          >
            <InputNumber<number>
                min={0}
                max={500}
                style={{width:'100%'}}
                formatter={(value) => {
                  // 确保只显示整数部分
                  if (value === null || value === undefined) return '';
                  return Math.floor(value).toString(); // 强制转换为整数并返回字符串
                }}
                parser={(value) => {
                  // 移除所有非数字字符，并返回整数值
                  if (!value) return 0;
                  const parsedValue = parseInt(value.replace(/\D/g, ''), 10); // 只保留数字部分
                  return isNaN(parsedValue) ? 0 : parsedValue; // 如果解析失败，返回 0
                }}
              />
          </Form.Item>

          <Form.Item
            label="性别"
            name="gender"
            rules={[{ required: true, message: '请选择性别!' }]}
          >
            <Select placeholder="请选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="生日"
            name="birthday"
            rules={[{ required: true, message: '请选择生日!' }]}
          >
            <DatePicker 
            disabledDate={(current) => {
              const today = dayjs().endOf("day"); // 当天的最后一秒
              const minDate = dayjs("1900-01-01").startOf("day"); // 1900年1月1日的第一秒
              // 禁用今天之后的日期以及1900年1月1日之前的日期
              return current && (current.isAfter(today) || current.isBefore(minDate));}}
            />
          </Form.Item>

          {/* BMI */}
                {bmi && (
                  <div className={styles["form-group"]}>
                    <label className={styles["form-label"]}>BMI指数</label>
                    <div className={styles["bmi-container"]}>
                      <div className={styles["bmi-row"]}>
                        <span>{bmi}</span>
                        <span className={styles[`bmi-category ${getBmiCategoryClass(bmi)}`]}>
                          {getBmiCategory(bmi)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

          <Form.Item>
            <Button loading={saving} type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
        </div>
      </div>
    </div>
  );
}; 