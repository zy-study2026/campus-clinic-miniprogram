<template>
  <view class="container">
    <view class="record-list" v-if="records.length > 0">
      <view
        v-for="record in records"
        :key="record.id"
        class="record-card"
        @click="goToDetail(record)"
      >
        <view class="record-header">
          <text class="record-date">{{ formatDate(record.date) }}</text>
          <text class="record-time">{{ record.time_slot }}</text>
        </view>
        <view class="record-info">
          <view class="doctor-info">
            <text class="doctor-name">{{ record.doctor_name }}</text>
            <text class="department-name">{{ record.department_name }}</text>
          </view>
          <text class="diagnosis-preview">{{ record.diagnosis || '暂无诊断' }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无病历记录</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      records: [],
      userInfo: null
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/medical-record',
          method: 'GET',
          data: {
            studentId: this.userInfo?.username
          }
        });
        if (res.code === 200) {
          this.records = res.data;
        }
      } catch (error) {
        console.error('加载病历失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    },

    goToDetail(record) {
      uni.navigateTo({
        url: `/pages/student/record-detail?id=${record.id}`
      });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-top: 20rpx;
}

.record-list {
  padding: 0 30rpx;
}

.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  flex-direction: column;
  margin-right: 24rpx;
}

.record-date {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.record-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.record-info {
  flex: 1;
}

.doctor-info {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.doctor-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-right: 16rpx;
}

.department-name {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.diagnosis-preview {
  font-size: 26rpx;
  color: #999;
  display: block;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>