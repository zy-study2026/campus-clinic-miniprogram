<template>
  <view class="container safe-area-top">
    <view class="user-card">
      <view class="avatar">
        <text class="avatar-icon">👔</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo?.name }}</text>
        <text class="user-role">管理员</text>
      </view>
    </view>
    
    <view class="info-section">
      <view class="info-item">
        <text class="info-label">账号</text>
        <text class="info-value">{{ userInfo?.username }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">手机号</text>
        <text class="info-value">{{ userInfo?.phone || '未绑定' }}</text>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-item" @click="goToChangePhone">
        <view class="menu-icon">📱</view>
        <text class="menu-text">修改手机号</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="goToChangePassword">
        <view class="menu-icon">🔒</view>
        <text class="menu-text">修改密码</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item logout" @click="logout">
        <view class="menu-icon">🚪</view>
        <text class="menu-text">退出登录</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: null
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
  },
  methods: {
    goToChangePhone() {
      if (!this.userInfo?.phone) {
        uni.showToast({ title: '请先绑定手机号', icon: 'none' });
        return;
      }
      uni.navigateTo({ url: '/pages/change-phone/index' });
    },
    
    goToChangePassword() {
      uni.navigateTo({ url: '/pages/change-password/index' });
    },
    
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('userInfo');
            uni.reLaunch({ url: '/pages/login/index' });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  padding: 60rpx 40rpx;
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
}

.avatar-icon {
  font-size: 60rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-role {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.info-section {
  margin: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.menu-section {
  margin: 0 30rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item.logout {
  color: #ff6b6b;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-item.logout .menu-text {
  color: #ff6b6b;
}

.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}
</style>
