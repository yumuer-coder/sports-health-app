import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// 获取一周的饮食数据
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    
    const startDateStr = request.nextUrl.searchParams.get('startDate');
    const endDateStr = request.nextUrl.searchParams.get('endDate');
    
    let startDate, endDate;
    
    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      endDate = new Date();
      
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // 7天中包括今天
    }

    const { data: dietEntries, error: entriesError } = await supabase
      .from('DietEntry')
      .select('id, date, totalCalories')
      .eq('userId', userId)
      .gte('date', startDate.toLocaleString().replace(/\//g, '-'))
      .lte('date', endDate.toLocaleString().replace(/\//g, '-'))
      .order('date');
    
    if (entriesError) {
      console.error('获取周饮食数据失败:', entriesError);
      return NextResponse.json(
        { success: false, message: '获取周饮食数据失败' },
        { status: 500 }
      );
    }


    // 计算每天的卡路里
    const dateCaloriesMap: { [key: string]: number } = {};
    
    const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dates = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toLocaleDateString().replace(/\//g, '-');
      const dayIndex = currentDate.getDay(); // 0是周日, 1是周一。。。
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 转换为  0 = 周一, ..., 6 = 周日
      
      dates.push({
        date: dateStr,
        day: dayLabels[adjustedIndex],
        value: 0
      });
      
      dateCaloriesMap[dateStr] = 0;
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 计算每日卡路里总和
    if (dietEntries && dietEntries.length > 0) {
      dietEntries.forEach(entry => {
        // 确保有一个有效的日期和卡路里
        if (!entry.date || entry.totalCalories === null || entry.totalCalories === undefined) {
          console.error('无效的日期或卡路里:', entry);
          return;
        }

        const entryDate = new Date(entry.date);
        const dateStr = entryDate.toLocaleDateString().replace(/\//g, '-');
        
        
        // 将卡路里添加到相应的日期
        if (dateCaloriesMap[dateStr] !== undefined) {
          dateCaloriesMap[dateStr] += entry.totalCalories;
        } else {
          console.error(`日期${dateStr}未在map中找到`);
        }
      });
    }
        
    // 更新日期数组中的值
    dates.forEach(date => {
      date.value = dateCaloriesMap[date.date];
    });

    const response = {
      success: true,
      data: dates
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('获取周饮食数据时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取周饮食数据时出错' },
      { status: 500 }
    );
  }
} 