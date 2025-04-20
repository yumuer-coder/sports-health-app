import OSS from 'ali-oss';
import SMSClient from '@alicloud/sms-sdk';

// 初始化SMS客户端
export function getSmsClient() {
  return new SMSClient({
    accessKeyId: process.env.MESSAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.MESSAGE_ACCESS_KEY_SECRET || '',
  });
}

// 通过SMS发送验证码
export async function sendSmsCode(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const smsClient = getSmsClient();
    const result = await smsClient.sendSMS({
      PhoneNumbers: phoneNumber,
      SignName: process.env.SMS_SIGN_NAME || '',
      TemplateCode: process.env.SMS_TEMPLATE_CODE || '',
      TemplateParam: JSON.stringify({ code }),
    });

    return result.Code === 'OK';
  } catch (error) {
    console.error('发送短信失败:', error);
    return false;
  }
}

// 初始化OSS客户端
export function getOssClient() {
  return new OSS({
    region: process.env.OSS_REGION || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
  });
}

// 上传文件到OSS
export async function uploadToOss(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  try {
    const ossClient = getOssClient();
    const result = await ossClient.put(filename, buffer, {
      mime: mimeType,
      timeout: 600 * 1000, 
    } as any); // 绕过TS检查

    return result.url;
  } catch (error) {
    console.error('上传文件到OSS失败:', error);
    throw new Error('上传文件到OSS失败');
  }
}

// 为私有bucket生成带有临时签名的OSS URL
export function generateOssSignedUrl(filename: string, expiration: number = 3600): string {
  try {
    const ossClient = getOssClient();
    const url = ossClient.signatureUrl(filename, {
      expires: expiration,
    });

    return url;
  } catch (error) {
    console.error('生成签名URL失败:', error);
    throw new Error('生成签名URL失败');
  }
} 