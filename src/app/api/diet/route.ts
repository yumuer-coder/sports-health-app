import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { MealType } from '@/types/diet';

// 获取用户在某一日期范围内的饮食记录
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const dateStr = request.nextUrl.searchParams.get('date');
    const date = dateStr ? new Date(dateStr).toLocaleDateString().replace(/\//g, '-') : new Date().toLocaleDateString().replace(/\//g, '-');

    // 获取指定日期的饮食记录
    const { data: dietEntries, error: entriesError } = await supabase
      .from('DietEntry')
      .select(`
        id, mealType, date, totalCalories,
        items:DietItem(
          id, foodId, quantity, calories,
          food:Food(id, name, category, unit, calories, image)
        )
      `)
      .eq('userId', Number(userId))
      .eq('date', date)
      .order('date');
    
    if (entriesError) {
      console.error('获取饮食记录失败:', entriesError);
      return NextResponse.json(
        { success: false, message: '获取饮食记录失败' },
        { status: 500 }
      );
    }

    // 通过餐食类型计算卡路里
    const mealTypeCalories = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    let totalCalories = 0;

    dietEntries.forEach(entry => {
      const mealType = entry.mealType as keyof typeof mealTypeCalories;
      if (mealTypeCalories[mealType] !== undefined) {
        mealTypeCalories[mealType] += entry.totalCalories;
      }
      totalCalories += entry.totalCalories;
    });

    const response = {
      success: true,
      data: {
        entries: dietEntries,
        summary: {
          date: date,
          totalCalories,
          mealTypeCalories,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('获取饮食记录时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取饮食记录时出错' },
      { status: 500 }
    );
  }
}

// 更新或保存饮食记录
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { mealType, items, date } = await request.json();

    if (!mealType || !items || !items.length) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (!MealType.includes(mealType)) {
      return NextResponse.json(
        { success: false, message: '无效的餐次类型' },
        { status: 400 }
      );
    }

    const entryDate = date ? new Date(date).toLocaleString().replace(/\//g, '-') : new Date().toLocaleString().replace(/\//g, '-');
    
    // 检查此用户、用餐类型和日期的记录是否已存在
    const { data: existingEntryData, error: findError } = await supabase
        .from('DietEntry')
        .select('id')
        .eq('userId', Number(userId))
        .eq('mealType', mealType)
        .eq('date', entryDate)
        .single();

        
    let existingEntry = existingEntryData;

    let dietEntryId: number;
    let totalCalories = 0;
    
    // 如果记录存在，更新它；否则创建一个新的
    if (existingEntry) {
      dietEntryId = existingEntry.id;
      
      // 删除此记录的现有饮食项目
      const { error: deleteItemsError } = await supabase
        .from('DietItem')
        .delete()
        .eq('dietEntryId', dietEntryId);
      
      if (deleteItemsError) {
        console.error('删除现有饮食记录时出错:', deleteItemsError);
        throw deleteItemsError;
      }
    } else {
      // 创建新的饮食记录
      const { data: newEntry, error: createError } = await supabase
        .from('DietEntry')
        .insert({
          userId: Number(userId),
          mealType,
          date: entryDate,
          totalCalories: 0, // 后面再更新
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString()
        })
        .select()
        .single();
      
      if (createError || !newEntry) {
        console.error('创建饮食记录失败:', createError);
        return NextResponse.json(
          { success: false, message: '创建饮食记录失败' },
          { status: 500 }
        );
      }
      
      dietEntryId = newEntry.id;
    }

    // 创建每条饮食记录并计算总热量
    const dietItems = [];
    for (const item of items) {
      const { foodId, quantity } = item;
      
      if (!foodId || !quantity) {
        continue;
      }

      const { data: food, error: foodError } = await supabase
          .from('Food')
          .select('*')
          .eq('id', foodId)
          .single();

      if (foodError || !food) {
          console.error('查找食物错误:', foodError);
          continue;
        }
        
      // 计算每条饮食记录的卡路里
      const itemCalories = Math.round(food.calories * quantity);
      totalCalories += itemCalories;

      // 创建单条饮食
      const { data: dietItem, error: itemError } = await supabase
        .from('DietItem')
        .insert([
          {
            dietEntryId,
            foodId,
            quantity,
            calories: itemCalories,
          },
        ])
        .select()
        .single();

      if (itemError) {
        console.error('创建单条饮食记录错误:', itemError);
        throw itemError;
      }

      dietItems.push(dietItem);
    }

    // 更新总卡路里
    const { error: updateError } = await supabase
      .from('DietEntry')
      .update({ 
        totalCalories,
        updatedAt: new Date().toLocaleString()
      })
      .eq('id', dietEntryId);

    if (updateError) {
      console.error('更新总卡路里错误:', updateError);
      throw updateError;
    }

    return NextResponse.json(
      { 
        success: true, 
        message: existingEntry ? '饮食记录更新成功' : '饮食记录添加成功'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('添加或更新饮食记录时出错:', error);
    return NextResponse.json(
      { success: false, message: '添加或更新饮食记录时出错' },
      { status: 500 }
    );
  }
} 