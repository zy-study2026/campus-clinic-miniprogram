<template>
  <view class="container safe-area-top">
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">原密码</text>
        <view class="input-wrapper">
          <text class="input-icon">🔒</text>
          <input 
            v-model="oldPassword" 
            class="input" 
            placeholder="请输入原密码" 
            type="password"
          />
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">新密码</text>
        <view class="input-wrapper">
          <text class="input-icon">🔑</text>
          <input 
            v-model="newPassword" 
            class="input" 
            placeholder="请输入新密码" 
            type="password"
          />
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">确认密码</text>
        <view class="input-wrapper">
          <text class="input-icon">🔑</text>
          <input 
            v-model="confirmPassword" 
            class="input" 
            placeholder="请确认新密码" 
            type="password"
          />
        </view>
      </view>
      
      <button class="submit-btn" @click="changePassword" :disabled="!canSubmit">
        <text>确认修改</text>
      </button>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      userInfo: null
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
  },
  computed: {
    canSubmit() {
      return this.oldPassword && this.newPassword && this.confirmPassword;
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    async changePassword() {
      if (!this.canSubmit) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      if (this.newPassword.length < 6) {
        uni.showToast({ title: '密码长度不能少于6位', icon: 'none' });
        return;
      }
      
      if (this.newPassword !== this.confirmPassword) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
        return;
      }
      
      if (this.newPassword === this.oldPassword) {
        uni.showToast({ title: '新密码不能与原密码相同', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '修改中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/changePassword',
          method: 'POST',
          data: {
            username: this.userInfo?.username,
            oldPassword: this.oldPassword,
            newPassword: this.newPassword
          }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '密码修改成功', icon: 'success' });
          
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' });
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '修改失败', icon: 'none' });
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

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
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
</style>
