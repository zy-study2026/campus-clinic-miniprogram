<template>
  <view class="container safe-area-top">
    <view class="header">
      <text class="title">绑定手机号</text>
      <text class="subtitle">请绑定您的手机号，以便接收重要通知</text>
    </view>
    
    <view class="form-section">
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">📱</text>
          <input 
            v-model="phone" 
            class="input" 
            placeholder="请输入手机号" 
            type="number"
            maxlength="11"
          />
        </view>
      </view>
      
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">🔢</text>
          <input 
            v-model="code" 
            class="input" 
            placeholder="请输入验证码" 
            type="number"
            maxlength="6"
          />
          <button 
            class="send-code-btn" 
            @click="sendCode" 
            :disabled="countdown > 0 || !phone"
          >
            <text>{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</text>
          </button>
        </view>
      </view>
      
      <button class="submit-btn" @click="bindPhone" :disabled="!phone || !code">
        <text>确认绑定</text>
      </button>
    </view>
    
    <view class="tips">
      <text>⚠️ 一个手机号只能绑定一个账号</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      phone: '',
      code: '',
      countdown: 0,
      userInfo: null
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
  },
  methods: {
    async sendCode() {
      if (!this.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '发送中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/sendSms',
          method: 'POST',
          data: { phone: this.phone }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '验证码已发送', icon: 'success' });
          this.countdown = 60;
          this.startCountdown();
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    startCountdown() {
      const timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    },
    
    async bindPhone() {
      if (!this.phone || !this.code) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return;
      }
      
      if (!/^\d{6}$/.test(this.code)) {
        uni.showToast({ title: '请输入6位验证码', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '绑定中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/bindPhone',
          method: 'POST',
          data: {
            phone: this.phone,
            code: this.code,
            username: this.userInfo?.username
          }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '绑定成功', icon: 'success' });
          
          const updatedUserInfo = { ...this.userInfo, phone: this.phone, is_phone_bound: 1 };
          uni.setStorageSync('userInfo', updatedUserInfo);
          
          setTimeout(() => {
            this.goToHome(this.userInfo.role);
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '绑定失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    goToHome(role) {
      switch (role) {
        case 'student':
          uni.switchTab({ url: '/pages/student/home' });
          break;
        case 'doctor':
          uni.switchTab({ url: '/pages/doctor/home' });
          break;
        case 'admin':
          uni.switchTab({ url: '/pages/admin/home' });
          break;
        default:
          uni.switchTab({ url: '/pages/student/home' });
      }
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.header {
  padding: 60rpx 0;
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 30rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  height: 96rpx;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input {
  flex: 1;
  font-size: 30rpx;
  height: 100%;
}

.send-code-btn {
  width: 180rpx;
  height: 64rpx;
  background: #007AFF;
  border-radius: 12rpx;
  border: none;
  color: #fff;
  font-size: 26rpx;
  margin-left: 16rpx;
}

.send-code-btn:disabled {
  background: #ccc;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  border: none;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 20rpx;
}

.submit-btn:disabled {
  opacity: 0.5;
}

.tips {
  text-align: center;
  margin-top: 40rpx;
}

.tips text {
  font-size: 24rpx;
  color: #ff6b6b;
}
</style>
