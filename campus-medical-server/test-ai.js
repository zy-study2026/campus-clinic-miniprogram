const WebSocket = require('ws');
const crypto = require('crypto');
const querystring = require('querystring');

const APPID = 'c283ec9d';
const APIKey = '7f2064798a83742fc46431a5765283b1';
const APISecret = 'OTNjYWY4ZDcwZDAxYmQ1MmFmODIwYmYy';
const WSS_URL = 'wss://spark-api.xf-yun.com/v4.0/chat';

function generateAuthUrl() {
  const nowDate = new Date();
  const date = nowDate.toUTCString();

  const signatureOrigin = `host: spark-api.xf-yun.com\ndate: ${date}\nGET /v4.0/chat HTTP/1.1`;
  const signatureSha = crypto.createHmac('sha256', APISecret).update(signatureOrigin).digest('base64');
  const authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  const params = {
    authorization: authorization,
    date: date,
    host: 'spark-api.xf-yun.com'
  };

  return WSS_URL + '?' + querystring.stringify(params);
}

const systemPrompt = `你是校园医务室的AI导诊助手。用户描述症状后，请推荐就诊科室、给出安全非处方药参考（仅限校园常备药）、以及居家护理建议。回复需简洁、安全，最后加上免责声明：以上建议仅供参考，不能替代专业医疗诊断。`;

async function testAI() {
  const authUrl = generateAuthUrl();
  console.log('连接地址:', authUrl);

  const ws = new WebSocket(authUrl);
  let responseData = '';
  let startTime = Date.now();

  ws.on('open', () => {
    console.log('WebSocket连接已建立');
    const payload = {
      header: { app_id: APPID, uid: 'test_' + Date.now() },
      parameter: { chat: { domain: '4.0Ultra', temperature: 0.5, max_tokens: 2048 } },
      payload: {
        message: {
          text: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: '我感冒了，有点发烧' }
          ]
        }
      }
    };
    ws.send(JSON.stringify(payload));
    console.log('已发送请求');
  });

  ws.on('message', (data) => {
    const result = JSON.parse(data.toString());
    console.log(`\n收到响应 [${Date.now() - startTime}ms]:`);
    console.log('header:', JSON.stringify(result.header));
    console.log('choices.status:', result.payload?.choices?.status);
    
    if (result.payload?.choices?.text) {
      result.payload.choices.text.forEach(item => {
        if (item?.content) {
          responseData += item.content;
          process.stdout.write(item.content);
        }
      });
    }

    if (result.payload?.choices?.status === 2) {
      console.log('\n\n响应结束');
      ws.close();
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`\nWebSocket关闭: code=${code}, reason=${reason}`);
    console.log('总耗时:', Date.now() - startTime, 'ms');
    console.log('完整响应:', responseData);
    process.exit(0);
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
    process.exit(1);
  });

  setTimeout(() => {
    console.log('\n超时！强制结束');
    console.log('当前收集到的响应:', responseData);
    ws.close();
    process.exit(0);
  }, 30000);
}

testAI();