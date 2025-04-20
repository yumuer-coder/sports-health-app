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
    
    // 保存token到Supabase
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7天后过期

      // 检查是否存在 userId 为 user.id 的记录
      const { data: existingToken, error: checkError } = await supabase
      .from('Token')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('检查Token失败:', checkError);
      return NextResponse.json({ success: false, message: '登录失败，无法检查令牌' }, { status: 500 });
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
        .eq('userId', user.id);

      if (updateError) {
        console.error('Token更新错误:', updateError);
        return NextResponse.json({ success: false, message: '登录失败，无法更新令牌' }, { status: 500 });
      }
    } else {
      // 插入新记录
      const { error: insertError } = await supabase
        .from('Token')
        .insert({
          token,
          userId: user.id,
          expires: expires.toLocaleString(),
          createdAt: new Date().toLocaleString()
        });

      if (insertError) {
        console.error('创建Token失败:', insertError);
        return NextResponse.json({ success: false, message: '登录失败，无法生成令牌' }, { status: 500 });
      }
    }

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