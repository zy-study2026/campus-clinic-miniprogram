<template>
  <view class="container safe-area-top">
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">旧手机号</text>
        <view class="input-wrapper">
          <text class="input-icon">📱</text>
          <input 
            v-model="oldPhone" 
            class="input" 
            placeholder="请输入旧手机号" 
            type="number"
            maxlength="11"
          />
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">旧手机号验证码</text>
        <view class="input-wrapper">
          <text class="input-icon">🔢</text>
          <input 
            v-model="oldPhoneCode" 
            class="input" 
            placeholder="请输入验证码" 
            type="number"
            maxlength="6"
          />
          <button 
            class="send-code-btn" 
            @click="sendOldCode" 
            :disabled="oldCountdown > 0 || !oldPhone"
          >
            <text>{{ oldCountdown > 0 ? `${oldCountdown}s` : '发送' }}</text>
          </button>
        </view>
      </view>
      
      <view class="divider">
        <text>更换为新手机号</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">新手机号</text>
        <view class="input-wrapper">
          <text class="input-icon">📱</text>
          <input 
            v-model="newPhone" 
            class="input" 
            placeholder="请输入新手机号" 
            type="number"
            maxlength="11"
          />
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">新手机号验证码</text>
        <view class="input-wrapper">
          <text class="input-icon">🔢</text>
          <input 
            v-model="newPhoneCode" 
            class="input" 
            placeholder="请输入验证码" 
            type="number"
            maxlength="6"
          />
          <button 
            class="send-code-btn" 
            @click="sendNewCode" 
            :disabled="newCountdown > 0 || !newPhone"
          >
            <text>{{ newCountdown > 0 ? `${newCountdown}s` : '发送' }}</text>
          </button>
        </view>
      </view>
      
      <button class="submit-btn" @click="changePhone" :disabled="!canSubmit">
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
      oldPhone: '',
      oldPhoneCode: '',
      newPhone: '',
      newPhoneCode: '',
      oldCountdown: 0,
      newCountdown: 0,
      userInfo: null
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.oldPhone = this.userInfo?.phone || '';
  },
  computed: {
    canSubmit() {
      return this.oldPhone && this.oldPhoneCode && this.newPhone && this.newPhoneCode;
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    async sendOldCode() {
      if (!this.oldPhone) {
        uni.showToast({ title: '请输入旧手机号', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '发送中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/sendSms',
          method: 'POST',
          data: { phone: this.oldPhone }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '验证码已发送', icon: 'success' });
          this.oldCountdown = 60;
          this.startCountdown('old');
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    async sendNewCode() {
      if (!this.newPhone) {
        uni.showToast({ title: '请输入新手机号', icon: 'none' });
        return;
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.newPhone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return;
      }
      
      if (this.newPhone === this.oldPhone) {
        uni.showToast({ title: '新手机号不能与旧手机号相同', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '发送中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/sendSms',
          method: 'POST',
          data: { phone: this.newPhone }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '验证码已发送', icon: 'success' });
          this.newCountdown = 60;
          this.startCountdown('new');
        } else {
          uni.showToast({ title: res.msg || '发送失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    startCountdown(type) {
      const timer = setInterval(() => {
        if (type === 'old') {
          this.oldCountdown--;
          if (this.oldCountdown <= 0) clearInterval(timer);
        } else {
          this.newCountdown--;
          if (this.newCountdown <= 0) clearInterval(timer);
        }
      }, 1000);
    },
    
    async changePhone() {
      if (!this.canSubmit) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '修改中...' });
      
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/changePhone',
          method: 'POST',
          data: {
            username: this.userInfo?.username,
            oldPhone: this.oldPhone,
            oldPhoneCode: this.oldPhoneCode,
            newPhone: this.newPhone,
            newPhoneCode: this.newPhoneCode
          }
        });
        
        uni.hideLoading();
        
        if (res.code === 200) {
          uni.showToast({ title: '手机号修改成功', icon: 'success' });
          
          const updatedUserInfo = { ...this.userInfo, phone: this.newPhone };
          uni.setStorageSync('userInfo', updatedUserInfo);
          
          setTimeout(() => {
            uni.navigateBack();
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

.send-code-btn {
  width: 140rpx;
  height: 64rpx;
  background: #007AFF;
  border-radius: 12rpx;
  border: none;
  color: #fff;
  font-size: 24rpx;
  margin-left: 16rpx;
}

.send-code-btn:disabled {
  background: #ccc;
}

.divider {
  text-align: center;
  padding: 20rpx 0;
  margin: 20rpx 0;
  border-top: 1rpx dashed #e0e0e0;
  border-bottom: 1rpx dashed #e0e0e0;
}

.divider text {
  font-size: 26rpx;
  color: #999;
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
