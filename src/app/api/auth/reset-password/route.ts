import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { sendSmsCode } from '@/lib/alibaba';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, verificationCode, password } = await req.json();
    
    if (!phoneNumber || !verificationCode || !password) {
      return NextResponse.json({ 
        success: false, 
        message: '请提供完整信息' 
      }, { status: 400 });
    }

    // 验证验证码
    const { data: validCode, error: codeError } = await supabase
      .from('VerificationCode')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('code', verificationCode)
      .gt('expiresAt', new Date().toLocaleString())
      .single();

    if (codeError || !validCode) {
      return NextResponse.json({ 
        success: false, 
        message: '验证码错误或已过期' 
      }, { status: 400 });
    }

    // 查找用户
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('phone', phoneNumber)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: '未找到该用户' 
      }, { status: 404 });
    }

    // 更新密码
    const hashedPassword = await hashPassword(password);
    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        password: hashedPassword,
        updatedAt: new Date().toLocaleString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('密码更新失败:', updateError);
      return NextResponse.json({ 
        success: false, 
        message: '密码更新失败' 
      }, { status: 500 });
    }

    // 删除已使用的验证码
    const { error: deleteError } = await supabase
      .from('VerificationCode')
      .delete()
      .eq('id', validCode.id);

    if (deleteError) {
      console.error('删除已使用验证码失败:', deleteError);
    }

    return NextResponse.json({
      success: true,
      message: '密码重置成功',
    }, { status: 200 });

  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '重置密码失败' 
    }, { status: 500 });
  }
} 

export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.nextUrl.searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: '请提供手机号码' },
        { status: 400 }
      );
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的手机号码' },
        { status: 400 }
      );
    }

    // 生成6位数验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 有效期10分钟
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

     // 检查是否存在 phoneNumber 对应的VerificationCode
      const { data: existingVerificationCode, error: checkError } = await supabase
      .from('VerificationCode')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('验证码保存失败:', checkError);
      return NextResponse.json({ success: false, message: '验证码保存失败' }, { status: 500 });
    }

    if (existingVerificationCode) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('VerificationCode')
        .update({
        code,
        expiresAt: expiresAt.toLocaleString(),
        createdAt: new Date().toLocaleString()
        })
        .eq('phone', phoneNumber);

      if (updateError) {
        console.error('Token更新失败:', updateError);
        return NextResponse.json({ success: false, message: '验证码保存失败' }, { status: 500 });
      }
    } else {
     // 插入新记录
      const { error: insertError } = await supabase
      .from('VerificationCode')
      .insert({
        phone: phoneNumber,
        code,
        expiresAt: expiresAt.toLocaleString(),
        createdAt: new Date().toLocaleString()
      });

    if (insertError) {
      console.error('验证码保存失败:', insertError);
      return NextResponse.json(
        { success: false, message: '验证码保存失败' },
        { status: 500 }
      );
    }
    }  

    // 通风SMS发送验证码
    const sent = await sendSmsCode(phoneNumber, code);

    if (!sent) {
      return NextResponse.json(
        { success: false, message: '发送验证码失败，请稍后再试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '验证码已发送',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('发送验证码过程中出现错误:', error);
    return NextResponse.json(
      { success: false, message: '发送验证码过程中出现错误' },
      { status: 500 }
    );
  }
} 