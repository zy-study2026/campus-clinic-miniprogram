<template>
  <view class="container safe-area-top">
    
    
    <view class="step-indicator">
      <view 
        v-for="(step, index) in steps" 
        :key="index"
        class="step-item"
        :class="{ active: currentStep >= index, done: currentStep > index }"
      >
        <text class="step-number">{{ index + 1 }}</text>
        <text class="step-label">{{ step }}</text>
      </view>
    </view>
    
    <view class="form-section">
      <view v-if="currentStep === 0">
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">👤</text>
            <input 
              v-model="username" 
              class="input" 
              placeholder="请输入学号/工号" 
              type="text"
            />
          </view>
        </view>
        
        <button class="submit-btn" @click="checkUsername" :disabled="!username">
          <text>下一步</text>
        </button>
      </view>
      
      <view v-else-if="currentStep === 1">
        <view class="phone-info">
          <text class="label">绑定手机号：</text>
          <text class="value">{{ phone }}</text>
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
              :disabled="countdown > 0"
            >
              <text>{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</text>
            </button>
          </view>
        </view>
        
        <button class="submit-btn" @click="verifyCode" :disabled="!code">
          <text>下一步</text>
        </button>
      </view>
      
      <view v-else-if="currentStep === 2">
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              v-model="newPassword" 
              class="input" 
              placeholder="请输入新密码" 
              type="password"
            />
          </view>
        </view>
        
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              v-model="confirmPassword" 
              class="input" 
              placeholder="请确认新密码" 
              type="password"
            />
          </view>
        </view>
        
        <button class="submit-btn" @click="resetPassword" :disabled="!newPassword || !confirmPassword">
          <text>确认重置</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      steps: ['输入账号', '验证身份', '重置密码'],
      currentStep: 0,
      username: '',
      phone: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      countdown: 0
    };
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    async checkUsername() {
      if (!this.username) {
        uni.showToast({ title: '请输入账号', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '验证中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/user/info',
          method: 'GET',
          data: { username: this.username }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          if (!res.data.phone) {
            uni.showModal({
              title: '提示',
              content: '该账号未绑定手机号，请联系管理员重置密码',
              showCancel: false,
              success: () => {
                uni.navigateBack();
              }
            });
            return;
          }
          
          this.phone = res.data.phone;
          this.currentStep = 1;
        } else {
          uni.showToast({ title: res.msg || '账号不存在', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    async sendCode() {
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
    
    verifyCode() {
      if (!this.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' });
        return;
      }
      
      if (!/^\d{6}$/.test(this.code)) {
        uni.showToast({ title: '请输入6位验证码', icon: 'none' });
        return;
      }
      
      this.currentStep = 2;
    },
    
    async resetPassword() {
      if (!this.newPassword || !this.confirmPassword) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      if (this.newPassword !== this.confirmPassword) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
        return;
      }
      
      if (this.newPassword.length < 6) {
        uni.showToast({ title: '密码长度不能少于6位', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '重置中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/forgetPassword',
          method: 'POST',
          data: {
            username: this.username,
            phone: this.phone,
            code: this.code,
            newPassword: this.newPassword
          }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '密码重置成功', icon: 'success' });
          
          setTimeout(() => {
            uni.navigateBack({ delta: 2 });
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '重置失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
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

.step-indicator {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0 40rpx;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.step-label {
  font-size: 24rpx;
  color: #999;
}

.step-item.active .step-number {
  background: #007AFF;
  color: #fff;
}

.step-item.active .step-label {
  color: #007AFF;
}

.step-item.done .step-number {
  background: #52c41a;
  color: #fff;
}

.step-item.done .step-label {
  color: #52c41a;
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.phone-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.phone-info .label {
  font-size: 28rpx;
  color: #666;
}

.phone-info .value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
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
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>
