import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isValidToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ success: false, message: '未提供Token' }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: '无效的token' }, { status: 401 });
    }

    const isValid = await isValidToken(token);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Token已过期或无效' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: decoded.sub,
        permissionCode: decoded?.permissionCode,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('无法验证token:', error);
    return NextResponse.json({ success: false, message: '无法验证token' }, { status: 500 });
  }
} 