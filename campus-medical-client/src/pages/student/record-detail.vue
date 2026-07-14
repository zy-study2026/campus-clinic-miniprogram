<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="header-title">病历详情</text>
      </view>
    </view>

    <view class="content" v-if="record">
      <view class="patient-info">
        <text class="info-title">患者信息</text>
        <view class="info-grid">
          <view class="info-item">
            <text class="label">姓名</text>
            <text class="value">{{ record.name }}</text>
          </view>
          <view class="info-item">
            <text class="label">性别</text>
            <text class="value">{{ record.gender }}</text>
          </view>
          <view class="info-item">
            <text class="label">年龄</text>
            <text class="value">{{ record.age }}岁</text>
          </view>
          <view class="info-item">
            <text class="label">学号</text>
            <text class="value">{{ record.student_id }}</text>
          </view>
        </view>
      </view>

      <view class="visit-info">
        <text class="info-title">就诊信息</text>
        <view class="info-row">
          <text class="label">就诊科室</text>
          <text class="value">{{ record.department_name }}</text>
        </view>
        <view class="info-row">
          <text class="label">就诊日期</text>
          <text class="value">{{ formatDate(record.date) }}</text>
        </view>
        <view class="info-row">
          <text class="label">就诊时段</text>
          <text class="value">{{ record.time_slot }}</text>
        </view>
        <view class="info-row">
          <text class="label">接诊医生</text>
          <text class="value">{{ record.doctor_name }}</text>
        </view>
      </view>

      <view class="record-section">
        <text class="section-title">主诉</text>
        <text class="section-content">{{ record.chief_complaint || '暂无' }}</text>
      </view>

      <view class="record-section">
        <text class="section-title">现病史</text>
        <text class="section-content">{{ record.present_history || '暂无' }}</text>
      </view>

      <view class="record-section">
        <text class="section-title">既往史</text>
        <text class="section-content">{{ record.past_history || '暂无' }}</text>
      </view>

      <view class="record-section">
        <text class="section-title">检查</text>
        <text class="section-content">{{ record.examination || '暂无' }}</text>
      </view>

      <view class="record-section">
        <text class="section-title">诊断</text>
        <text class="section-content diagnosis">{{ record.diagnosis || '暂无' }}</text>
      </view>

      <view class="record-section">
        <text class="section-title">处理</text>
        <text class="section-content">{{ record.treatment || '暂无' }}</text>
      </view>

      <view class="record-time">
        <text class="time-text">记录时间：{{ formatDateTime(record.record_time) }}</text>
      </view>
    </view>

    <view class="loading" v-else>
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      record: null,
      userInfo: null
    };
  },
  onLoad(options) {
    this.userInfo = uni.getStorageSync('userInfo');
    if (options?.id) {
      this.loadRecord(options.id);
    }
  },
  methods: {
    async loadRecord(recordId) {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/medical-record',
          method: 'GET',
          data: {
            studentId: this.userInfo?.username
          }
        });
        if (res.code === 200) {
          this.record = res.data.find(r => r.id == recordId);
          if (!this.record) {
            uni.showToast({ title: '病历不存在', icon: 'none' });
          }
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

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 30rpx;
}

.header-content {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 48rpx;
  color: #fff;
  margin-right: 20rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.content {
  padding: 140rpx 30rpx 30rpx;
  overflow-y: auto;
  height: 100vh;
  box-sizing: border-box;
}

.patient-info,
.visit-info {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.info-item,
.info-row {
  display: flex;
  flex-direction: column;
}

.info-row {
  margin-bottom: 16rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.record-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 20rpx;
  display: block;
}

.section-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

.section-content.diagnosis {
  color: #52c41a;
  font-weight: bold;
}

.record-time {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 30rpx;
  text-align: center;
}

.time-text {
  font-size: 24rpx;
  color: #999;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>