import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 定时任务：每日零点（北京时间）重置今日运动时长
export async function GET(request: NextRequest) {
  try {
    // 重置所有用户的todayExerciseSeconds
    const { error } = await supabase
      .from('User')
      .update({
        todayExerciseSeconds: 0,
        updatedAt: new Date().toLocaleString()
      })
      .not('id', 'is', null); // 更新所有用户

    if (error) {
      console.error('重置运动时长失败:', error);
      return NextResponse.json(
        { success: false, message: '重置运动时长失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: '成功重置所有用户的今日运动时长',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('定时任务执行失败:', error);
    return NextResponse.json(
      { success: false, message: '重置运动时长失败' },
      { status: 500 }
    );
  }
} 