export const uniRequest = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      timeout: 60000, // AI服务响应较慢，设置60秒超时
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};
