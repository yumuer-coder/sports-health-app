import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { calculateBmi } from '@/lib/auth';

// 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const userId = Number(request.headers.get('x-user-id'));
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        phone,
        name,
        gender,
        birthday,
        height,
        weight,
        bmi,
        avatar,
        totalExerciseSeconds,
        todayExerciseSeconds,
        isFirstLogin
      `)
      .eq('id', userId)
      .single();

    const { data: workoutPlan, error:workoutPlanError } = await supabase
      .from('WorkoutPlan')
      .select(`
        plan
      `)
      .eq('userId', userId)
      .single();

      if (error) {
        console.error('获取用户资料时出错:', error);
        return NextResponse.json(
          { success: false, message: '获取用户资料时出错' },
          { status: 500 }
        );
      }
      if (workoutPlanError && workoutPlanError?.code !== 'PGRST116') {
        console.error('获取用户资料时出错:', workoutPlanError);
        return NextResponse.json(
          { success: false, message: '获取用户资料时出错' },
          { status: 500 }
        );
      }

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userData = {
      user,
      workoutPlan: workoutPlan?.plan || null, 
    };

    return NextResponse.json(
      { success: true, data: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取用户资料时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取用户资料时出错' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    // 从请求体获取数据
    const requestBody = await request.json();
    let { userId, name, gender, birthday, height, weight, isFirstLogin } = requestBody;
    
    userId=Number(userId)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未提供用户ID' },
        { status: 400 }
      );
    }

    
    // 获取用户信息
    // const { data: user, error :userError} = await supabase
    //   .from('User')
    //   .select('*')
    //   .eq('id', userId)
    //   .single();

    // if (userError) {
    //   return NextResponse.json(
    //     { success: false, message: '获取用户信息失败' },
    //     { status: 500 }
    //   );
    // }

    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, message: '用户不存在' },
    //     { status: 404 }
    //   );
    // }

    // 计算BMI
    // let bmi = user.bmi;
    let bmi = 0;
    if (height && weight) {
      bmi = await calculateBmi(weight, height);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (birthday !== undefined) updateData.birthday = new Date(birthday);
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (bmi !== undefined) updateData.bmi = bmi;
    if (isFirstLogin !== undefined) updateData.isFirstLogin = isFirstLogin;

    const { data: updatedUser, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single();

      if (error) {
        console.error('更新用户资料时出错:', error);
        return NextResponse.json(
          { success: false, message: '更新用户资料时出错' },
          { status: 500 }
        );
      }

    return NextResponse.json(
      { success: true, message: '资料更新成功', data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('更新用户资料时出错:', error);
    return NextResponse.json(
      { success: false, message: '更新用户资料时出错' },
      { status: 500 }
    );
  }
} 