# 健身应用

健身应用是一个帮助用户管理健身活动和饮食习惯的全栈应用程序。

## 技术栈

- **前端**: Next.js, React, TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (通过Supabase)
- **身份验证**: JWT
- **存储**: 阿里云OSS

## 功能

- 用户认证(登录/注册)
- 健身视频浏览
- 个人资料管理
- 健身计划生成
- 饮食记录和统计
- 视频点赞和收藏
- AI助手问答

## 安装

1. 克隆仓库
   ```
   git clone <repository-url>
   cd sports-health-app
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 配置环境变量
   创建 `.env` 文件，添加以下变量:
   ```
   # Supabase配置
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   SUPABASE_DB_URL=your-supabase-db-url

   # JWT配置
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d

   # 阿里云配置
   MESSAGE_ACCESS_KEY_ID=your-message-access-key-id
   MESSAGE_ACCESS_KEY_SECRET=your-message-access-key-secret
   SMS_SIGN_NAME=your-sms-sign-name
   SMS_TEMPLATE_CODE=your-sms-template-code
   OSS_ACCESS_KEY_ID=your-oss-access-key-id
   OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
   OSS_BUCKET=your-oss-bucket
   OSS_REGION=your-oss-region

   # AI模型配置
   AI_MODEL_API_KEY=your-ai-model-api-key
   AI_MODEL_API_URL=your-ai-model-api-url
   ```

4. 初始化数据库
   ```
   npm run setup:supabase
   npm run seed
   ```

5. 启动开发服务器
   ```
   npm run dev
   ```

## Supabase迁移

本项目最初使用Prisma ORM，后来迁移到了Supabase。如果你需要进行迁移或者理解迁移方式，请查看 [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) 文件获取详细信息。

## API路由

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/register` - 发送注册验证码
- `POST /api/auth/reset-password` - 重置密码
- `GET /api/auth/reset-password` - 发送重置密码验证码

### 用户
- `GET /api/user/profile/get` - 获取当前用户资料
- `POST /api/user/profile` - 更新用户资料

### 视频
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取视频详情
- `POST /api/videos/favorite` - 收藏/取消收藏视频
- `POST /api/videos/like` - 点赞/取消点赞视频
- `POST /api/videos/upload` - 上传视频

### 健身计划
- `GET /api/workout/plan` - 获取健身计划
- `POST /api/workout/plan` - 生成健身计划

### 饮食
- `GET /api/foods` - 获取食物列表
- `GET /api/diet` - 获取饮食记录
- `POST /api/diet` - 创建饮食记录

## 测试账号

- **管理员**: 13800000000, 密码: admin123
- **普通用户**: 在注册页面创建

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
