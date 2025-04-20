import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const { videoId, watchedTime } = await request.json();
    const userId = payload.sub;

    if (!videoId || typeof watchedTime !== 'number') {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const watchedSeconds = watchedTime;

    // 检查视频是否存在
    const { data: videoData, error: videoError } = await supabase
      .from('Video')
      .select('id, title')
      .eq('id', videoId)
      .single();

    if (videoError || !videoData) {
      return NextResponse.json(
        { success: false, message: '视频不存在' },
        { status: 404 }
      );
    }

    // 检查此用户播放该视频的记录今天是否已存在
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingRecord, error: fetchError } = await supabase
      .from('PlayRecord')
      .select('id, watchedTime')
      .eq('userId', userId)
      .eq('videoId', videoId)
      .gte('createdAt', today.toLocaleString())
      .lt('createdAt', new Date(today.getTime() + 86400000).toLocaleString())
      .single();

    let playRecordId;
    let totalWatchedTime = watchedSeconds;

    if (existingRecord) {
      // 更新播放记录
      totalWatchedTime += existingRecord.watchedTime;
      
      const { data: updatedRecord, error: updateError } = await supabase
        .from('PlayRecord')
        .update({
          watchedTime: totalWatchedTime,
          updatedAt: new Date().toLocaleString()
        })
        .eq('id', existingRecord.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('更新播放记录失败:', updateError);
        return NextResponse.json(
          { success: false, message: '更新播放记录失败' },
          { status: 500 }
        );
      }
      
      playRecordId = updatedRecord.id;
    } else {
      // 创建新纪录
      const { data: newRecord, error: insertError } = await supabase
        .from('PlayRecord')
        .insert({
          userId,
          videoId,
          watchedTime: watchedSeconds,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('创建播放记录失败:', insertError);
        return NextResponse.json(
          { success: false, message: '创建播放记录失败' },
          { status: 500 }
        );
      }
      
      playRecordId = newRecord.id;
    }

    // 更新用户运动时长
    const { data: userData, error: userFetchError } = await supabase
      .from('User')
      .select('totalExerciseSeconds, todayExerciseSeconds, lastExerciseDate')
      .eq('id', userId)
      .single();

    if (userFetchError) {
      console.error('更新用户运动时长失败:', userFetchError);
      return NextResponse.json(
        { success: false, message: '更新用户运动时长失败' },
        { status: 500 }
      );
    }

    const newTotalExerciseSeconds = (userData.totalExerciseSeconds || 0) + watchedSeconds;
    const newTodayExerciseSeconds = (userData.todayExerciseSeconds || 0) + watchedSeconds;
    
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        totalExerciseSeconds: newTotalExerciseSeconds,
        todayExerciseSeconds: newTodayExerciseSeconds,
        lastExerciseDate: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('更新用户运动时长失败:', userUpdateError);
      return NextResponse.json(
        { success: false, message: '更新用户运动时长失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          id: playRecordId,
          watchedTime: totalWatchedTime,
          totalExerciseSeconds: newTotalExerciseSeconds,
          todayExerciseSeconds: newTodayExerciseSeconds
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('记录播放失败:', error);
    return NextResponse.json(
      { success: false, message: '记录播放失败' },
      { status: 500 }
    );
  }
}

// 获取用户的播放记录
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
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const dateParam = request.nextUrl.searchParams.get('date') || new Date().toLocaleDateString();

    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0); 
    const nextDay = new Date(date.getTime() + 86400000); 
    let dateFilter :{gte: string, lt: string} = {gte: '', lt: ''};

    dateFilter = {
      gte: date.toLocaleString(),
      lt: nextDay.toLocaleString()
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: records, error, count } = await supabase
      .from('PlayRecord')
      .select(`
        *,
        video:videoId (
          id,
          title,
          coverImage,
          type
        )
      `, { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(from, to)
      .filter('createdAt', 'gte', dateFilter.gte)
      .filter('createdAt', 'lt', dateFilter.lt);


    if (error) {
      console.error('获取播放记录失败:', error);
      return NextResponse.json(
        { success: false, message: '获取播放记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          records,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('获取播放记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取播放记录失败' },
      { status: 500 }
    );
  }
} 