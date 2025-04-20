import OpenAI from 'openai';

interface GenerateWorkoutPlanParams {
  goal: string;
  height: number;
  weight: number;
  age: number;
  gender: string;
  experience: string;
  frequency: string;
}

export async function generateWorkoutPlan(params: GenerateWorkoutPlanParams): Promise<string> {
  try {
    const apiKey = process.env.AI_MODEL_API_KEY;
    const apiUrl = process.env.AI_MODEL_API_URL;

    if (!apiKey || !apiUrl) {
      throw new Error('未配置AI模型API');
    }

    // 初始化OpenAI客户端
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: apiUrl,
    });

    let goalCn = ''
    switch (params.goal) {
      case 'buildMuscles':
        goalCn = '增肌'
        break
      case 'reducingFat':
        goalCn = '减脂'
        break
        case 'improvedEndurance':
          goalCn = '提高耐力'
          break
        case 'enhanceCoreStrength':
          goalCn = '增强核心力量'
          break
    }

    const prompt = `为具有以下特征的用户生成个性化的健身计划，健身计划应为中文，注意：不要返回引言部分或计划概述，只返回健身计划主体即可：
          - 目标：${goalCn}
          - 身高：${params.height} 厘米
          - 体重：${params.weight} 公斤
          - 年龄：${params.age} 岁
          - 性别：${params.gender}
          - 经验水平：${params.experience}
          - 每周锻炼频率：${params.frequency}
          健身计划应为一个为期7天的计划，包含清晰且具体的活动，请注意只能使用"跑步30分钟"、"跳绳15分钟"、"俯卧撑20个"、"深蹲15个"这类格式生成健身计划。
          每天应安排2-3项活动，并注明每项活动的持续时间或次数。`

    // 使用OpenAI SDK调用API
    const response = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: "system", content: "你是一位健身教练和营养师，专注于提供专业、实用且易于理解的建议，涵盖健身计划、饮食营养、健康生活方式等方面。你的目标是帮助用户实现健康目标，同时确保建议科学合理且适合个人需求。" },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    // 处理OpenAI SDK响应格式
    if (!response.choices || response.choices.length === 0) {
      throw new Error('AI模型API的响应无效');
    }

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('生成健身方案失败:', error);
    return '生成健身方案失败，请稍后再试。';
  }
} 