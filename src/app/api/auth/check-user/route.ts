import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.nextUrl.searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: '请提供手机号码' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的手机号码' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(
      { 
        success: true,
        exists: !!user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('检查用户失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 