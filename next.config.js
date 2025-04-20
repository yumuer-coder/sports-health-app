/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  reactStrictMode: true,
  output: 'standalone',
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    MESSAGE_ACCESS_KEY_ID: process.env.MESSAGE_ACCESS_KEY_ID,
    MESSAGE_ACCESS_KEY_SECRET: process.env.MESSAGE_ACCESS_KEY_SECRET,
    SMS_SIGN_NAME: process.env.SMS_SIGN_NAME,
    SMS_TEMPLATE_CODE: process.env.SMS_TEMPLATE_CODE,
    OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET: process.env.OSS_BUCKET,
    OSS_REGION: process.env.OSS_REGION,
    AI_MODEL_API_KEY: process.env.AI_MODEL_API_KEY,
    AI_MODEL_API_URL: process.env.AI_MODEL_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img2.baidu.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "pic.rmb.bdstatic.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "b0.bdstatic.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "imgservice.suning.cn",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "bkimg.cdn.bcebos.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "qcloud.dpfile.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "pics5.baidu.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "q6.itc.cn",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "sportshealthapp.oss-cn-hangzhou.aliyuncs.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "http",
        hostname: "sportshealthapp.oss-cn-hangzhou.aliyuncs.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
    ],
    // domains: ['aliyuncs.com', 'localhost','sportshealthapp.oss-cn-hangzhou.aliyuncs.com']
  },
  webpack: (config, { isServer }) => {
    // 忽略某些文件的扫描
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/Application Data',
          '**/AppData',
          '**/.next',
        ],
      };
    }
    // 处理需要排除的模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // 配置模块规则
    config.module.rules.push({
      test: /\.html$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
      },
    });

    return config;
  },
  // experimental: {
  //   serverExternalPackages: [],
  // },
  // middleware: {
  //   matcher: ['/((?!api/static|_next/static|_next/image|favicon.ico).*)'],
  // },
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 