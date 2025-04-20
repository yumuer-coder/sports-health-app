'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from './VideoUploadPage.module.css';
import { Input, Select } from 'antd';

// 文件大小限制
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_VIDEO_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

export default function VideoUploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    type: 'workout', 
    description: '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>('');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // 获取视频秒数
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      
      video.onerror = (e) => {
        reject(`获取视频秒数失败: ${e}`);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // 上传图片
  const uploadCoverImage = async (file: File) => {
    if (!file) return null;
    
    try {
      setCoverUploading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return null;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        toast.success('封面上传成功');
        return response.data.url;
      } else {
        throw new Error(response.data.message || '封面上传失败');
      }
    } catch (error) {
      console.log('封面上传失败:', error);
      toast.error('封面上传失败');
      return null;
    } finally {
      setCoverUploading(false);
    }
  };
  
  // 上传视频
  const uploadVideo = async (file: File) => {
    if (!file) return null;
    
    try {
      setVideoUploading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return null;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/upload/video', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(progress);
          }
        },
      });
      
      if (response.data.success) {
        toast.success('视频上传成功');
        return response.data.url;
      } else {
        throw new Error(response.data.message || '视频上传失败');
      }
    } catch (error) {
      console.log('视频上传失败:', error);
      toast.error('视频上传失败');
      return null;
    } finally {
      setVideoUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (name:string, val:string) => {
    setFormData({
      ...formData,
      [name]: val,
    });

    // 清除错误信息
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors({
        ...errors,
        coverImage: `图片大小不能超过${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
      });
      toast.error(`图片大小不能超过${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors({
        ...errors,
        coverImage: '请选择图片文件',
      });
      toast.error('请选择图片文件');
      return;
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    
    if (errors.coverImage) {
      setErrors({
        ...errors,
        coverImage: '',
      });
    }
    
    const imageUrl = await uploadCoverImage(file);
    if (imageUrl) {
      setCoverImageUrl(imageUrl);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE) {
      setErrors({
        ...errors,
        videoFile: `视频大小不能超过${MAX_VIDEO_SIZE / (1024 * 1024 * 1024)}GB`,
      });
      toast.error(`视频大小不能超过${MAX_VIDEO_SIZE / (1024 * 1024 * 1024)}GB`);
      return;
    }

    if (!file.type.startsWith('video/')) {
      setErrors({
        ...errors,
        videoFile: '请选择视频文件',
      });
      toast.error('请选择视频文件');
      return;
    }

    setVideoFile(file);
    setVideoName(file.name);
    toast.success('视频文件已选择');
    
    if (errors.videoFile) {
      setErrors({
        ...errors,
        videoFile: '',
      });
    }
    
    try {
      // 获取视频秒数
      const duration = await getVideoDuration(file);
      setVideoDuration(duration);
      
      // 上传视频
      const uploadedVideoUrl = await uploadVideo(file);
      if (uploadedVideoUrl) {
        setVideoUrl(uploadedVideoUrl);
      }
    } catch (error) {
      console.log('处理视频文件时出错:', error);
      toast.error('处理视频文件时出错');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    if (!formData.title.trim()) {
      newErrors.title = '请输入视频标题';
      hasErrors = true;
    }

    if (!formData.title.trim()) {
      newErrors.title = '视频标题应为2~50个字符';
      hasErrors = true;
    }

    if (!formData.type) {
      newErrors.type = '请选择视频类型';
      hasErrors = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入视频描述';
      hasErrors = true;
    } else if (formData.description.length > 200) {
      newErrors.description = '描述不能超过200字';
      hasErrors = true;
    }

    if (!coverImageUrl) {
      newErrors.coverImage = '请上传视频封面';
      hasErrors = true;
    }

    if (!videoUrl) {
      newErrors.videoFile = '请上传视频文件';
      hasErrors = true;
    }

    setErrors(newErrors);
    
    if (hasErrors) {
      toast.error('请完善表单信息');
    }
    
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const createResponse = await axios.post(
        '/api/videos/upload',
        {
          title: formData.title,
          type: formData.type,
          description: formData.description,
          coverImage: coverImageUrl,
          videoUrl,
          duration: videoDuration
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (createResponse.data.success) {
        toast.success('视频创建成功！');
        router.push('/workout');
      }
    } catch (error) {
      console.log('创建视频记录失败，请重试:', error);
      toast.error('创建视频记录失败，请重试');
      setErrors({
        ...errors,
        submit: '创建视频记录失败，请重试',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>上传健身视频</div>
      </div>

      <div className={styles.content}>
        {globalError && (
          <div className={styles.errorBox}>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div  className={styles.label}>视频类型 *</div>
              <Select
                value={formData.type}
                style={{ width: '100%' }}
                onChange={(val) => handleInputChange('type',val)}
                options={[
                  { value: 'workout', label: '健身' },
                  { value: 'yoga', label: '瑜伽' },
                ]}
              />
              {errors.type && <div className={styles.errorText}>{errors.type}</div>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label}>视频标题 *</div>
              <Input
                value={formData.title}
                onChange={(e: any) => handleInputChange('title', e.target.value)}
                className={styles.input}
                placeholder="输入视频标题"
                maxLength={50}
              />
              <div className={styles.characterCount}>{formData.title.length}/50</div>
              {errors.title && <div className={styles.errorText}>{errors.title}</div>}
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.label}>封面图 *</div>
              {coverPreview ? (
                <div className={styles.coverPreview}>
                  <Image
                    src={coverPreview}
                    alt="视频封面"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <button 
                    type="button" 
                    className={styles.changeButton}
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                  >
                    {coverUploading ? '上传中...' : '更换封面'}
                  </button>
                </div>
              ) : (
                <div 
                  className={styles.uploadBox}
                  onClick={() => !coverUploading && coverInputRef.current?.click()}
                >
                  {coverUploading ? (
                    <div className={styles.uploadingIndicator}>
                      <div className={styles.loadingSpinner}></div>
                      <span>正在上传...</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <FiUploadCloud size={36} />
                      </div>
                      <div className={styles.uploadText}>点击上传封面图</div>
                      <div className={styles.uploadHint}>建议使用16:9的高清图片，最大1MB；只能上传jpeg、png、webp格式</div>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept="image/jpeg, image/png, image/webp"
                className={styles.hiddenInput}
                disabled={coverUploading}
              />
              {errors.coverImage && <div className={styles.errorText}>{errors.coverImage}</div>}
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.label}>视频文件 *</div>
              {videoName ? (
                <div className={styles.uploadBox} onClick={() => !videoUploading && videoInputRef.current?.click()}>
                  {videoUploading ? (
                    <div className={styles.uploadingIndicator}>
                      <div className={styles.loadingSpinner}></div>
                      <span>上传中 {uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <FiUploadCloud size={36} />
                      </div>
                      <div className={styles.fileName}>{videoName}</div>
                      <div className={styles.uploadHint}>
                        {videoUrl ? '视频已上传，点击可更换' : '点击更换视频'}
                      </div>
                      {videoDuration > 0 && (
                        <div className={styles.videoDuration}>时长: {Math.floor(videoDuration / 60)}分{videoDuration % 60}秒</div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.uploadBox} onClick={() => !videoUploading && videoInputRef.current?.click()}>
                  {videoUploading ? (
                    <div className={styles.uploadingIndicator}>
                      <div className={styles.loadingSpinner}></div>
                      <span>上传中 {uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <FiUploadCloud size={36} />
                      </div>
                      <div className={styles.uploadText}>点击上传视频文件</div>
                      <div className={styles.uploadHint}>支持mp4格式，最大1GB</div>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/mp4"
                className={styles.hiddenInput}
                disabled={videoUploading}
              />
              {errors.videoFile && <div className={styles.errorText}>{errors.videoFile}</div>}
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <div className={styles.label}>视频描述</div>
              <Input.TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e: any) => handleInputChange('description',e.target.value)}
                className={styles.textarea}
                placeholder="输入视频描述"
                autoSize
                maxLength={200}
              />
              <div className={styles.characterCount}>{formData.description.length}/200</div>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={uploading || videoUploading || coverUploading}
          >
            {uploading ? '提交中...' : '提交'}
          </button>
        </form>
      </div>
    </div>
  );
} 