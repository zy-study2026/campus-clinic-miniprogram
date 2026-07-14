<template>
  <view class="container safe-area-top">
    <view class="profile-header">
      <view class="avatar">
        <text class="avatar-icon">👨‍⚕️</text>
      </view>
      <view class="profile-info">
        <text class="name">{{ userInfo?.name }}</text>
        <text class="role">医生</text>
      </view>
    </view>

    <view class="info-section">
      <view class="info-item">
        <text class="info-label">手机号</text>
        <text class="info-value">{{ userInfo?.phone || '未绑定' }}</text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @tap="goToDetailInfo">
        <text class="menu-icon">📋</text>
        <text class="menu-text">详细信息</text>
        <text class="menu-arrow">→</text>
      </view>
      <view class="menu-item" @tap="goToChangePassword">
        <text class="menu-icon">🔒</text>
        <text class="menu-text">修改密码</text>
        <text class="menu-arrow">→</text>
      </view>
      <view class="menu-item" @tap="goToChangePhone">
        <text class="menu-icon">📱</text>
        <text class="menu-text">修改手机号</text>
        <text class="menu-arrow">→</text>
      </view>
      <view class="menu-item logout" @tap="logout">
        <text class="menu-icon">🚪</text>
        <text class="menu-text">退出登录</text>
        <text class="menu-arrow">→</text>
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
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
  },
  methods: {
    goToDetailInfo() {
      uni.navigateTo({ url: '/pages/doctor/detail-info' });
    },

    goToChangePassword() {
      uni.navigateTo({ url: '/pages/change-password/index' });
    },

    goToChangePhone() {
      uni.navigateTo({ url: '/pages/change-phone/index' });
    },

    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('userInfo');
            uni.redirectTo({ url: '/pages/login/index' });
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

.profile-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 60rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 60rpx;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.role {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.info-section {
  margin: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
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

.menu-list {
  margin: 30rpx;
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

.menu-item.logout .menu-text {
  color: #ff6b6b;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}
</style>
