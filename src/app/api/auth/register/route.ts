import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { hashPassword, generateToken, saveToken } from '@/lib/auth';
import { sendSmsCode } from '@/lib/alibaba';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, password, verificationCode } = await req.json();
    if (!phoneNumber || !password) {
      return NextResponse.json({ success: false, message: '请提供手机号和密码' }, { status: 400 });
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
      return NextResponse.json({ success: false, message: '验证码错误或已过期' }, { status: 400 });
    }

    // 检查用户是否已存在
    const { data: existingUser, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if(userError && userError.code!=='PGRST116'){
      throw new Error('检查用户失败',userError);
    }

    if (existingUser) {
      return NextResponse.json({ success: false, message: '该手机号已注册' }, { status: 409 });
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password);
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert({
        phone: phoneNumber,
        password: hashedPassword,
        permissionCode: 'user', // 默认权限为普通用户
        isFirstLogin: true,
        name: `用户${phoneNumber.substring(7)}`, // 默认昵称
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        totalExerciseSeconds: 0,
        todayExerciseSeconds: 0,
        role: 'user'
      })
      .select()
      .single();

    if (createError || !user) {
      console.error('用户创建失败:', createError);
      return NextResponse.json({ success: false, message: '用户创建失败' }, { status: 500 });
    }

    // 生成token
    const token = await generateToken(user.id, user.permissionCode);
    await saveToken(token, user.id);

    // 删除已使用的验证码
    const { error: deleteError } = await supabase
      .from('VerificationCode')
      .delete()
      .eq('id', validCode.id);

    if (deleteError) {
      console.error('删除验证码失败:', deleteError);
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          permissionCode: user.permissionCode,
          isFirstLogin: user.isFirstLogin,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ success: false, message: '注册失败' }, { status: 500 });
  }
}

// 发送验证码
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

    // 检查用户是否已存在
    const { data: existingUser, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('phone', phoneNumber)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该手机号已注册' },
        { status: 409 }
      );
    }

    // 生成6位数验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 有效期10分钟
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 保存验证码到数据库
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

    // 通过SMS发送验证码
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
        // 在开发环境下返回验证码，生产环境中应移除
        data: process.env.NODE_ENV === 'development' ? { code } : undefined,
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