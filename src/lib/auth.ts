'use server';

import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from './supabase';
import { generateCacheKey, getCache, setCache, deleteCache } from './redis';

// Redis缓存
const TOKEN_CACHE_PREFIX = 'token';
const TOKEN_CACHE_TTL = 60 * 60 * 24 * 7; // 7天

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

export async function generateToken(userId: number, permissionCode: string | null): Promise<string> {
  const payload = {
    sub: userId,
    permissionCode,
    iat: Math.floor(Date.now() / 1000)
  };

  // 确保 JWT_SECRET 存在，否则抛出错误
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET环境变量未设置');
  }

  // 确保 expiresIn 是有效的字符串或数字
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // @ts-ignore - 忽略TypeScript类型检查
  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

export async function verifyToken(token: string): Promise<any> {
  try {
    // 先检查缓存中是否存在token验证结果
    const cacheKey = generateCacheKey(TOKEN_CACHE_PREFIX, token);
    const cachedPayload = await getCache<any>(cacheKey);
    
    if (cachedPayload) {
      return cachedPayload;
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }
    
    // 验证token
    const payload = jwt.verify(token, secret);
    
    // 缓存验证结果
    if (payload) {
      await setCache(cacheKey, payload, TOKEN_CACHE_TTL);
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

export async function saveToken(token: string, userId: number): Promise<void> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const expiresInMs = expiresIn.includes('d') 
    ? parseInt(expiresIn.replace('d', '')) * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  const expires = new Date(Date.now() + expiresInMs);
  
  // 检查是否存在 userId 
  const { data: existingToken, error: checkError } = await supabase
  .from('Token')
  .select('*')
  .eq('userId', userId)
  .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('=======',checkError);
    throw new Error('保存token失败');
  }

  // 解析token获取payload用于缓存
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET环境变量未设置');
  }
  
  const payload = jwt.verify(token, secret);
  const tokenCacheKey = generateCacheKey(TOKEN_CACHE_PREFIX, token);
  const userTokenCacheKey = generateCacheKey(`${TOKEN_CACHE_PREFIX}:user`, userId.toString());
  
  if (existingToken) {
    // 更新现有记录
    const { error: updateError } = await supabase
      .from('Token')
      .update({
        token,
        expires: expires.toLocaleString(),
        createdAt: new Date().toLocaleString()
      })
      .eq('userId', userId);

    if (updateError) {
      console.error('Token更新失败:', updateError);
      throw new Error('保存token失败');
    }
    
    // 如果存在旧token，清除旧token的缓存
    if (existingToken.token && existingToken.token !== token) {
      const oldTokenCacheKey = generateCacheKey(TOKEN_CACHE_PREFIX, existingToken.token);
      await deleteCache(oldTokenCacheKey);
    }
  } else {
    // 插入新记录
    const { error: insertError } = await supabase
      .from('Token')
      .insert({
        token,
        userId,
        expires: expires.toLocaleString(),
        createdAt: new Date().toLocaleString()
      });

    if (insertError) {
      console.error('Token插入失败:', insertError);
      throw new Error('保存token失败');
    }
  }
  
  // 缓存新token和用户对应的token
  await setCache(tokenCacheKey, payload, TOKEN_CACHE_TTL);
  await setCache(userTokenCacheKey, token, TOKEN_CACHE_TTL);
}

export async function isValidToken(token: string): Promise<boolean> {
  // 先从缓存检查token是否有效
  const cacheKey = generateCacheKey(TOKEN_CACHE_PREFIX, token);
  const cachedPayload = await getCache<any>(cacheKey);
  
  if (cachedPayload) {
    return true; // 如果缓存中存在token，则认为有效
  }
  
  // 否则检查数据库
  const { data: storedToken, error } = await supabase
    .from('Token')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !storedToken) {
    return false;
  }
  
  const expires = new Date(storedToken.expires);
  const isValid = expires > new Date();
  
  // 如果token有效，缓存它
  if (isValid) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const payload = jwt.verify(token, secret);
        await setCache(cacheKey, payload, TOKEN_CACHE_TTL);
      }
    } catch (error) {
      console.error('缓存token失败:', error);
    }
  }
  
  return isValid;
}

export async function invalidateUserToken(userId: number): Promise<void> {
  // 获取用户对应的token
  const userTokenCacheKey = generateCacheKey(`${TOKEN_CACHE_PREFIX}:user`, userId.toString());
  const token = await getCache<string>(userTokenCacheKey);
  
  // 清除用户token缓存
  await deleteCache(userTokenCacheKey);
  
  // 如果找到token，清除token缓存
  if (token) {
    const tokenCacheKey = generateCacheKey(TOKEN_CACHE_PREFIX, token);
    await deleteCache(tokenCacheKey);
  }
  
  // 从数据库中删除token记录
  await supabase
    .from('Token')
    .delete()
    .eq('userId', userId);
}

export async function getBmiCategory(bmi: number): Promise<string> {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 24.9) return 'Normal weight';
  if (bmi < 29.9) return 'Overweight';
  return 'Obese';
}

export async function calculateBmi(weight: number, height: number): Promise<number> {
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}