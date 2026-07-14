<template>
  <view class="container safe-area-top">
    <view class="list-container">
      <view class="record-item" v-for="item in records" :key="item.id" @tap="goToDetail(item.id)">
        <view class="item-header">
          <text class="patient-name">{{ item.student_name }}</text>
          <text class="record-date">{{ formatDate(item.record_time) }}</text>
        </view>
        <view class="item-content">
          <view class="info-row">
            <text class="info-label">就诊日期：</text>
            <text class="info-value">{{ item.date }} {{ item.time_slot }}</text>
          </view>
          <view class="diagnosis-row">
            <text class="diagnosis-label">诊断：</text>
            <text class="diagnosis-value">{{ item.diagnosis }}</text>
          </view>
        </view>
        <view class="item-footer">
          <text class="action-text">点击查看详情 →</text>
        </view>
      </view>

      <view class="empty-state" v-if="records.length === 0">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无病历记录</text>
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
      records: []
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadRecords();
  },
  onShow() {
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      if (!this.userInfo?.id) return;

      uni.showLoading({ title: '加载中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/medicalRecords',
          method: 'GET',
          data: { doctorId: this.userInfo.id }
        });

        if (res.code === 200) {
          this.records = res.data;
        }
      } catch (error) {
        console.error('加载病历列表失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    goToDetail(recordId) {
      uni.navigateTo({ url: `/pages/doctor/medical-record-detail?recordId=${recordId}` });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.list-container {
  padding: 20rpx 30rpx;
}

.record-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.patient-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.record-date {
  font-size: 24rpx;
  color: #999;
}

.item-content {
  padding: 16rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
  font-size: 26rpx;
}

.info-label {
  color: #999;
  width: 140rpx;
}

.info-value {
  color: #333;
  flex: 1;
}

.diagnosis-row {
  display: flex;
  font-size: 26rpx;
}

.diagnosis-label {
  color: #999;
  width: 140rpx;
}

.diagnosis-value {
  color: #4facfe;
  flex: 1;
  font-weight: bold;
}

.item-footer {
  padding-top: 16rpx;
}

.action-text {
  font-size: 26rpx;
  color: #4facfe;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
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
