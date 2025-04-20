'use server';

import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from './supabase';

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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }
    
    // 验证token
    const payload = jwt.verify(token, secret);
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
}

export async function isValidToken(token: string): Promise<boolean> {
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
  
  return isValid;
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