const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const crypto = require('crypto');
const querystring = require('querystring');
const pool = require('../config/db'); // 引入数据库连接池

const APPID = 'c283ec9d';
const APIKey = '7f2064798a83742fc46431a5765283b1';
const APISecret = 'OTNjYWY4ZDcwZDAxYmQ1MmFmODIwYmYy';
const WSS_URL = 'wss://spark-api.xf-yun.com/v4.0/chat';

function generateAuthUrl() {
  const nowDate = new Date();
  const date = nowDate.toUTCString();

  const signatureOrigin = `host: spark-api.xf-yun.com\ndate: ${date}\nGET /v4.0/chat HTTP/1.1`;

  const signatureSha = crypto.createHmac('sha256', APISecret)
    .update(signatureOrigin)
    .digest('base64');

  const authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;

  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  const params = {
    authorization: authorization,
    date: date,
    host: 'spark-api.xf-yun.com'
  };

  return WSS_URL + '?' + querystring.stringify(params);
}

/**
 * 从数据库获取科室列表
 */
async function getDepartments() {
  try {
    const [rows] = await pool.execute('SELECT name, description FROM department');
    return rows.map(row => ({ name: row.name, description: row.description }));
  } catch (error) {
    console.error('查询科室列表失败:', error);
    return [];
  }
}

/**
 * 从数据库获取药品列表（取前20种）
 */
async function getDrugs() {
  try {
    const [rows] = await pool.execute(
      'SELECT name, indication FROM drug ORDER BY category_id, id LIMIT 20'
    );
    return rows.map(row => ({ name: row.name, indication: row.indication }));
  } catch (error) {
    console.error('查询药品列表失败:', error);
    return [];
  }
}

/**
 * 生成动态系统提示词
 */
async function generateSystemPrompt() {
  const departments = await getDepartments();
  const drugs = await getDrugs();

  if (departments.length === 0 || drugs.length === 0) {
    return '科室和药品列表获取失败，请稍后再试。';
  }

  // 格式化科室列表
  const departmentList = departments.map(d => d.name).join('、');

  // 格式化药品列表（包含适应症）
  const drugList = drugs.map(d => `${d.name}（${d.indication || '无'}）`).join('；\n');

  return `你是高校校园医务室专属健康咨询AI助手，为在校学生描述身体症状后，自动匹配推荐对应就诊科室、给出安全非处方常用药品参考、居家护理建议。严格禁止确诊疾病、禁止处方药指导、禁止私自用药医嘱，所有药品仅为校园常备药科普参考，用药前务必咨询校医与专业医师，严重症状立即前往正规医院就诊。

用户描述身体症状后，请按以下三步回复：
第一步：精准推荐适配的校园医务室小程序里已有就诊科室。
第二步：推荐校园医务室小程序里已有的常见、安全非处方对症药品，并标注用药注意禁忌。
第三步：补充日常护理、休息饮食建议。

【可用科室列表】：${departmentList}
【可用药品列表】：
${drugList}

规则约束：
- 你只能从上述科室列表中选择推荐科室，不得推荐列表外的科室。
- 你只能从上述药品列表中选择推荐药品，不得推荐列表外的药品。
- 若用户症状不适合列表中的任何科室或药品，请建议用户前往校医务室咨询医生。
- 全程使用口语化、简洁的语言，贴合大学生场景。
- 严守医疗安全规范，不做疾病确诊，不给出处方药、诊疗手术方案。
- 回复中自然使用换行和分隔符（如 ### 或 ---），让前端能清晰展示。
- 最后务必加上免责声明：以上建议仅供参考，不能替代专业医疗诊断。`;
}

router.post('/ai/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(200).json({ code: 400, msg: '请输入症状描述', data: null });
  }

  let responseData = '';
  let isResponded = false;
  let hasReceivedData = false;
  let activityTimer = null;

  const sendError = (errmsg) => {
    if (!isResponded) {
      isResponded = true;
      res.status(200).json({ code: 500, msg: errmsg, data: null });
    }
  };

  const sendSuccess = () => {
    if (!isResponded && responseData) {
      isResponded = true;
      res.status(200).json({ code: 200, msg: '操作成功', data: { reply: responseData } });
    }
  };

  const resetActivityTimer = () => {
    if (activityTimer) {
      clearTimeout(activityTimer);
    }
    activityTimer = setTimeout(() => {
      if (hasReceivedData && !isResponded) {
        sendSuccess();
      }
    }, 5000);
  };

  try {
    // 先从数据库获取科室和药品列表，生成动态系统提示词
    const systemPrompt = await generateSystemPrompt();
    
    // 如果获取数据失败，返回错误
    if (systemPrompt === '科室和药品列表获取失败，请稍后再试。') {
      return sendError('科室和药品列表获取失败，请稍后再试');
    }

    const authUrl = generateAuthUrl();
    console.log('连接AI服务:', authUrl);
    
    const ws = new WebSocket(authUrl);

    const connectionTimeout = setTimeout(() => {
      if (!hasReceivedData) {
        ws.close();
        sendError('AI服务连接超时');
      }
    }, 30000);

    ws.on('open', () => {
      console.log('WebSocket连接已建立');
      
      const payload = {
        header: {
          app_id: APPID,
          uid: 'user_' + Date.now()
        },
        parameter: {
          chat: {
            domain: '4.0Ultra',
            temperature: 0.5,
            max_tokens: 2048
          }
        },
        payload: {
          message: {
            text: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message.trim() }
            ]
          }
        }
      };

      ws.send(JSON.stringify(payload));
      console.log('已发送请求');
    });

    ws.on('message', (data) => {
      try {
        const result = JSON.parse(data.toString());
        console.log('收到AI响应:', JSON.stringify(result).substring(0, 200));

        if (result.header && result.header.code !== 0) {
          clearTimeout(connectionTimeout);
          clearTimeout(activityTimer);
          ws.close();
          sendError(`AI服务错误: ${result.header.message || '未知错误'}`);
          return;
        }

        if (result.payload && result.payload.choices) {
          const choices = result.payload.choices;
          if (Array.isArray(choices.text)) {
            choices.text.forEach(item => {
              if (item && item.content) {
                responseData += item.content;
                hasReceivedData = true;
              }
            });
          }

          resetActivityTimer();

          if (choices.status === 2 || result.header.status === 2) {
            clearTimeout(connectionTimeout);
            clearTimeout(activityTimer);
            ws.close();
            sendSuccess();
          }
        }
      } catch (error) {
        console.error('解析AI响应失败:', error);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(connectionTimeout);
      clearTimeout(activityTimer);
      console.error('WebSocket错误:', error);
      console.error('错误堆栈:', error.stack);

      if (error.message && error.message.includes('ENOTFOUND')) {
        sendError('AI服务网络连接失败，请检查网络');
      } else {
        sendError('AI服务连接失败，请稍后重试');
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(connectionTimeout);
      clearTimeout(activityTimer);
      console.log(`WebSocket关闭: code=${code}, reason=${reason}`);
      console.log('当前收集到的响应数据长度:', responseData.length);

      if (!isResponded) {
        if (responseData && responseData.length > 0) {
          console.log('WebSocket关闭时返回数据:', responseData.substring(0, 100) + '...');
          sendSuccess();
        } else {
          sendError('AI服务调用失败');
        }
      }
    });

  } catch (error) {
    console.error('创建WebSocket连接失败:', error);
    console.error('错误堆栈:', error.stack);
    sendError('AI服务网络连接失败，请检查网络');
  }
});

module.exports = router;