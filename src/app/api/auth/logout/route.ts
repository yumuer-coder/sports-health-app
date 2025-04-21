import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        
        if (!userId) {
        return NextResponse.json({ 
            success: false, 
            message: '用户ID不能为空' 
        }, { status: 400 });
        }

        // 清除Redis缓存和数据库中的token
        await invalidateUserToken(Number(userId));

        return NextResponse.json({
        success: true,
        message: '已成功退出登录'
        }, { status: 200 });
    } catch (error) {
        console.error('退出登录失败:', error);
        return NextResponse.json({ 
        success: false, 
        message: '退出登录失败，请稍后再试'
        }, { status: 500 });
    }
} 