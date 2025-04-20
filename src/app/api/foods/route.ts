import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { foodCategories } from '@/types/diet';
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const groupByCategory = request.nextUrl.searchParams.get('groupByCategory') === 'true';

    const rangeStart = (page - 1) * limit;
    const rangeEnd = page * limit - 1;

    // 如果请求分组，则获取所有类别
    if (groupByCategory) {
      const { data: foods, error } = await supabase
        .from('Food')
        .select('*')
        .order('category')
        .order('name');

      if (error) {
        console.error('获取食品列表时出错:', error);
        return NextResponse.json(
          { success: false, message: '获取食品列表时出错' },
          { status: 500 }
        );
      }
      
      const groupedFoods: Record<string, any[]> = {};
      
      // 初始化为空数组
      foodCategories.forEach(cat => {
        groupedFoods[cat] = [];
      });
      
      // 按类别对食物进行分组
      foods.forEach(food => {
        if (groupedFoods[food.category]) {
          groupedFoods[food.category].push(food);
        } else {
          // 处理不在预定义列表中的类别的食物
          if (!groupedFoods['other']) {
            groupedFoods['other'] = [];
          }
          groupedFoods['other'].push(food);
        }
      });

      const response = {
        success: true,
        data: groupedFoods
      };

      return NextResponse.json(response, { status: 200 });
    } 
    
    // 查询带过滤条件的食品
    // 创造过滤条件
    let query = supabase
      .from('Food')
      .select('*', { count: 'exact' })
      .range(rangeStart, rangeEnd)
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: foods, error, count: totalCount } = await query;

    if (error) {
      console.error('获取食品列表时出错:', error);
      return NextResponse.json(
        { success: false, message: '获取食品列表时出错' },
        { status: 500 }
      );
    }

    const response = { 
      success: true, 
      data: {
        foods,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil((totalCount||0) / limit),
        }
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('获取食品列表时出错:', error);
    return NextResponse.json(
      { success: false, message: '获取食品列表时出错' },
      { status: 500 }
    );
  }
}

// 添加新食品（仅admin可用）
export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: '无权限添加食品' },
        { status: 403 }
      );
    }

    const { name, category, unit, calories, image } = await request.json();

    if (!name || !category || !unit || !calories) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }
    // 在数据库中创建食品记录
    const { data: food, error: insertError } = await supabase.from('Food').insert([
      {
        name,
        category,
        unit,
        calories: parseFloat(calories.toString()), 
        image,
      },
    ]);

    if (insertError) {
      console.error('创建食品失败:', insertError);
      return NextResponse.json(
        { success: false, message: '创建食品失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '食品添加成功', data: food },
      { status: 201 }
    );
  } catch (error) {
    console.error('添加食品时出错:', error);
    return NextResponse.json(
      { success: false, message: '添加食品时出错' },
      { status: 500 }
    );
  }
} 