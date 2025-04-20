declare module 'ali-oss' {
  interface PutResult {
    url: string;
    name: string;
    res: any;
  }

  interface SignatureUrlOptions {
    expires?: number;
    method?: string;
    process?: string;
    response?: Record<string, any>;
  }

  class OSS {
    constructor(options: {
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      bucket: string;
    });

    put(name: string, file: Buffer | string, options?: { mime: string }): Promise<PutResult>;
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
  }

  export default OSS;
}

declare module '@alicloud/sms-sdk' {
  interface SendSMSParams {
    PhoneNumbers: string;
    SignName: string;
    TemplateCode: string;
    TemplateParam: string;
  }

  interface SMSResponse {
    Code: string;
    Message: string;
    RequestId: string;
    BizId?: string;
  }

  class SMSClient {
    constructor(options: {
      accessKeyId: string;
      secretAccessKey: string;
    });

    sendSMS(params: SendSMSParams): Promise<SMSResponse>;
  }

  export default SMSClient;
} 