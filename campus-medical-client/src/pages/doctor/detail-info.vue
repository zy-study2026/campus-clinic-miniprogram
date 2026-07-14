<template>
  <view class="container safe-area-top">
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">工号</text>
        <view class="form-value readonly">{{ userInfo?.username || '未填写' }}</view>
      </view>
      <view class="form-item">
        <text class="form-label">姓名</text>
        <view class="form-value readonly">{{ userInfo?.name || '未填写' }}</view>
      </view>
      <view class="form-item">
        <text class="form-label">性别 *</text>
        <view class="gender-picker">
          <view
            class="gender-option"
            :class="{ active: formData.gender === 0 }"
            @tap="formData.gender = 0"
          >
            <text>男</text>
          </view>
          <view
            class="gender-option"
            :class="{ active: formData.gender === 1 }"
            @tap="formData.gender = 1"
          >
            <text>女</text>
          </view>
        </view>
      </view>
      <view class="form-item">
        <text class="form-label">出生日期 *</text>
        <picker mode="date" :value="formData.birth_date" @change="onBirthDateChange">
          <view class="date-picker">
            {{ formData.birth_date || '请选择日期' }}
          </view>
        </picker>
      </view>
    </view>

    <view class="submit-section">
      <button class="submit-btn" @tap="submitForm">
        <text>保存</text>
      </button>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      userInfo: null,
      formData: {
        gender: 0,
        birth_date: ''
      }
    };
  },
  onLoad() {
    this.loadUserInfo();
  },
  methods: {
    formatDate(dateStr, returnEmpty = false) {
      if (!dateStr) return returnEmpty ? '' : '未填写';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return returnEmpty ? '' : '未填写';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    async loadUserInfo() {
      uni.showLoading({ title: '加载中...' });
      try {
        const userInfo = uni.getStorageSync('userInfo');
        if (!userInfo?.username) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/info',
          method: 'GET',
          data: { username: userInfo.username }
        });

        if (res.code === 200) {
          this.userInfo = res.data;
          this.formData = {
            gender: res.data?.gender !== undefined ? res.data.gender : 0,
            birth_date: this.formatDate(res.data?.birth_date, true)
          };
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    onBirthDateChange(e) {
      this.formData.birth_date = e.detail.value;
    },

    async submitForm() {
      if (!this.formData.birth_date) {
        uni.showToast({ title: '请选择出生日期', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '保存中...' });
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/info',
          method: 'PUT',
          data: {
            username: this.userInfo?.username,
            gender: this.formData.gender,
            birth_date: this.formData.birth_date
          }
        });

        if (res.code === 200) {
          uni.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '保存失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
  display: block;
}

.form-value {
  font-size: 30rpx;
  color: #333;
}

.form-value.readonly {
  background: #f5f5f5;
  padding: 20rpx;
  border-radius: 12rpx;
}

.gender-picker {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.gender-option.active {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
  border-color: #4facfe;
}

.date-picker {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  color: #333;
}

.submit-section {
  margin-top: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  border: none;
}
</style>