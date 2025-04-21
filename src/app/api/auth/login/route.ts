import { NextRequest, NextResponse } from 'next/server';
import { comparePasswords, generateToken, saveToken } from '@/lib/auth';
import supabase from '@/lib/supabase';

// 获取环境变量中的JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, password } = await req.json();
    
    if (!phoneNumber || !password) {
      return NextResponse.json({ success: false, message: '请提供手机号和密码' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('id, password, permissionCode, name, avatar, gender, birthday, height, weight, isFirstLogin')
      .eq('phone', phoneNumber)
      .single();

    if (error || !user) {
      console.error('查找用户失败:', error);
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 401 });
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 });
    }

    // 生成token
    const token = await generateToken(user.id, user.permissionCode);
    
    // 使用saveToken函数，该函数已经实现了Redis缓存
    await saveToken(token, user.id);

    // 返回用户信息和token
    return NextResponse.json({
      success: true,
      data: {
        token,
        userId: user.id,
        role: user.permissionCode,
        isFirstLogin: user.isFirstLogin,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '登录失败，请稍后再试'
    }, { status: 500 });
  }
} 