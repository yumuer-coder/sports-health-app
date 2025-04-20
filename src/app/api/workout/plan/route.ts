import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { generateWorkoutPlan } from '@/lib/ai';

// 获取用户健身计划
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户健身计划
    const { data: workoutPlan, error } = await supabase
      .from('WorkoutPlan')
      .select('*')
      .eq('userId', Number(userId))
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116是"没有找到结果"的错误代码
      console.error('获取健身计划失败:', error);
      return NextResponse.json(
        { success: false, message: '获取健身计划失败' },
        { status: 500 }
      );
    }

    if (!workoutPlan) {
      return NextResponse.json(
        { success: true, message: '还未生成健身方案', data: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: workoutPlan },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取健身方案时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取健身方案时出错' },
      { status: 500 }
    );
  }
}

// 生成新健身方案
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { goal, workoutDays, workoutTime, fitnessLevel, equipmentAccess } = await request.json();
    
    if (!goal) {
      return NextResponse.json(
        { success: false, message: '健身目标为必填项' },
        { status: 400 }
      );
    }

    // 从fitnessLevel映射到experience
    let experience = '中级';
    if (fitnessLevel === 'beginner') {
      experience = '初级';
    } else if (fitnessLevel === 'advanced') {
      experience = '高级';
    }

    // 从workoutDays映射到frequency
    const frequency = `每周${workoutDays}天`;

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('gender, birthday, height, weight, bmi')
      .eq('id', Number(userId))
      .single();
    
    if (userError) {
      return NextResponse.json(
        { success: false, message: '获取用户信息失败' },
        { status: 500 }
      );
    }

    if (!user || !user.height || !user.weight || !user.gender || !user.birthday) {
      return NextResponse.json(
        { success: false, message: '请先完善个人资料' },
        { status: 400 }
      );
    }

    // 计算年龄
    const birthYear = new Date(user.birthday).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    // 通过AI生成健身计划
    const plan = await generateWorkoutPlan({
      goal,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      age,
      experience,
      frequency,
    });

    // 在计划中添加训练时长信息
    const enhancedPlan = `训练时长: 每次${workoutTime}分钟\n装备要求: ${equipmentAccess ? '有器材' : '无器材'}\n\n${plan}`;

    // 保存或更新健身计划
    const { data: workoutPlan, error: upsertError } = await supabase
      .from('WorkoutPlan')
      .upsert({
        userId: Number(userId),
        goal,
        plan:enhancedPlan,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      }, {
        onConflict: 'userId'
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('保存健身计划失败:', upsertError);
      return NextResponse.json(
        { success: false, message: '保存健身计划失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '健身方案生成成功', data: workoutPlan },
      { status: 200 }
    );
  } catch (error) {
    console.error('生成健身方案时出错:', error);
    return NextResponse.json(
      { success: false, message: '生成健身方案时出错' },
      { status: 500 }
    );
  }
} 