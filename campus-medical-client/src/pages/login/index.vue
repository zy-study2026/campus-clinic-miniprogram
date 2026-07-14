<template>
  <view class="container safe-area-top">
    <view class="logo-section">
      <view class="logo">
        <text class="logo-icon">🏥</text>
      </view>
      <text class="title">校园医务室</text>
    </view>
    
    <view class="form-section">
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
      
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-icon">🔒</text>
          <input 
            v-model="password" 
            class="input" 
            placeholder="请输入密码" 
            :password="!showPassword"
          />
          <text class="eye-icon" @click="togglePassword">{{ showPassword ? '👁' : '👁‍🗨' }}</text>
        </view>
      </view>
      
      <view class="forget-link" @click="goToForgetPassword">
        <text>忘记密码？</text>
      </view>
      
      <button class="login-btn" @click="login" :disabled="!username || !password">
        <text>登 录</text>
      </button>
    </view>
    
    <view class="footer">
      <text class="copyright">© 2026 校园医务室管理系统</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      username: '',
      password: '',
      showPassword: false
    };
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    
    async login() {
      if (!this.username || !this.password) {
        uni.showToast({ title: '请填写账号密码', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '登录中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/login',
          method: 'POST',
          data: {
            username: this.username,
            password: this.password
          }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          const userInfo = res.data;

          uni.setStorageSync('userInfo', {
            id: userInfo.id,
            username: userInfo.username,
            role: userInfo.role,
            roleValue: userInfo.roleValue,
            name: userInfo.name,
            phone: userInfo.phone,
            is_phone_bound: userInfo.is_phone_bound
          });
          
          uni.showToast({ title: '登录成功', icon: 'success' });
          
          setTimeout(() => {
            if (userInfo.is_phone_bound === 0) {
              uni.navigateTo({ url: '/pages/bind-phone/index' });
            } else {
              this.goToHome(userInfo.role);
            }
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '登录失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    goToForgetPassword() {
      uni.navigateTo({ url: '/pages/forget-password/index' });
    },
    
    goToHome(role) {
      let url = '/pages/student/home';
      switch (role) {
        case 'student':
          url = '/pages/student/home';
          break;
        case 'doctor':
          url = '/pages/doctor/home';
          break;
        case 'admin':
          url = '/pages/admin/home';
          break;
      }
      uni.reLaunch({ url });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 30rpx;
  box-sizing: border-box;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  margin-bottom: 80rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.logo-icon {
  font-size: 80rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.form-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
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

.eye-icon {
  font-size: 36rpx;
  cursor: pointer;
}

.forget-link {
  text-align: right;
  margin-bottom: 40rpx;
}

.forget-link text {
  font-size: 26rpx;
  color: #007AFF;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  border: none;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.5;
}

.footer {
  text-align: center;
  margin-top: 60rpx;
}

.copyright {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
