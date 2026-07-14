<template>
  <view class="container safe-area-top">
    <view class="header">
      <view class="welcome">
        <text class="greeting">你好，{{ userInfo?.name }}</text>
        <text class="subtitle">医生工作台</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ pendingCount }}</text>
        <text class="stat-label">待就诊预约</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ recordCount }}</text>
        <text class="stat-label">已填写病历</text>
      </view>
    </view>

    <view class="quick-actions">
      <view class="action-item" @click="goToAppointments">
        <view class="action-icon">📅</view>
        <text class="action-text">预约审核</text>
        <view class="action-badge" v-if="pendingCount > 0">{{ pendingCount }}</view>
      </view>
      <view class="action-item" @click="goToRecords">
        <view class="action-icon">📋</view>
        <text class="action-text">我的病历</text>
      </view>
      <view class="action-item" @click="goToOrders">
        <view class="action-icon">📦</view>
        <text class="action-text">药品订单</text>
      </view>
      <view class="action-item" @click="goToProfile">
        <view class="action-icon">👤</view>
        <text class="action-text">个人中心</text>
      </view>
    </view>

    <view class="info-card">
      <text class="card-title">📌 工作提示</text>
      <view class="card-content">
        <text>• 请按时查看待就诊预约</text>
        <text>• 就诊后请及时填写病历</text>
        <text>• 药品订单为只读查看</text>
      </view>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      userInfo: null,
      pendingCount: 0,
      recordCount: 0
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadStats();
  },
  methods: {
    async loadStats() {
      if (!this.userInfo?.id) return;

      try {
        const [appointmentRes, recordRes] = await Promise.all([
          uniRequest({
            url: 'http://localhost:3000/api/doctor/appointments',
            method: 'GET',
            data: { doctorId: this.userInfo.id }
          }),
          uniRequest({
            url: 'http://localhost:3000/api/doctor/medicalRecords',
            method: 'GET',
            data: { doctorId: this.userInfo.id }
          })
        ]);

        if (appointmentRes.code === 200) {
          this.pendingCount = appointmentRes.data.length;
        }

        if (recordRes.code === 200) {
          this.recordCount = recordRes.data.length;
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    goToAppointments() {
      uni.navigateTo({ url: '/pages/doctor/appointments' });
    },

    goToRecords() {
      uni.navigateTo({ url: '/pages/doctor/medical-records' });
    },

    goToOrders() {
      uni.navigateTo({ url: '/pages/doctor/orders' });
    },

    goToProfile() {
      uni.navigateTo({ url: '/pages/doctor/profile' });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
  box-sizing: border-box;
}

.header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.welcome {
  display: flex;
  flex-direction: column;
}

.greeting {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #4facfe;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 26rpx;
  color: #999;
}

.stat-divider {
  width: 2rpx;
  height: 80rpx;
  background: #f0f0f0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.action-item {
  position: relative;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.action-text {
  font-size: 28rpx;
  color: #333;
}

.action-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: #ff4757;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  min-width: 40rpx;
  text-align: center;
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.card-content text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}
</style>
