const axios = require('axios');

async function testAI() {
  try {
    const response = await axios.post('http://localhost:3000/api/ai/chat', {
      message: '喉咙痛'
    });
    
    console.log('响应状态:', response.data.code);
    console.log('响应消息:', response.data.msg);
    console.log('AI回复:', response.data.data?.reply);
  } catch (error) {
    console.error('请求失败:', error.response?.data || error.message);
  }
}

testAI();