<template>
  <view class="container safe-area-top">
    <view class="detail-card" v-if="record">
      <view class="card-header">
        <text class="record-time">{{ formatTime(record.record_time) }}</text>
      </view>

      <view class="info-section">
        <view class="info-row">
          <text class="info-label">患者姓名</text>
          <text class="info-value">{{ record.student_name }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">学号</text>
          <text class="info-value">{{ record.student_username }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系电话</text>
          <text class="info-value">{{ record.student_phone }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">就诊日期</text>
          <text class="info-value">{{ record.date }} {{ record.time_slot }}</text>
        </view>
      </view>

      <view class="section" v-if="record.symptom">
        <text class="section-title">症状描述</text>
        <text class="section-content">{{ record.symptom }}</text>
      </view>

      <view class="section">
        <text class="section-title">主诉</text>
        <text class="section-content">{{ record.subjective }}</text>
      </view>

      <view class="section">
        <text class="section-title">现病史</text>
        <text class="section-content">{{ record.present_illness }}</text>
      </view>

      <view class="section">
        <text class="section-title">既往史</text>
        <text class="section-content">{{ record.past_history || '无' }}</text>
      </view>

      <view class="section">
        <text class="section-title">体格检查</text>
        <text class="section-content">{{ record.examination }}</text>
      </view>

      <view class="section">
        <text class="section-title">诊断结果</text>
        <text class="section-content diagnosis">{{ record.diagnosis }}</text>
      </view>

      <view class="section">
        <text class="section-title">治疗建议</text>
        <text class="section-content">{{ record.treatment }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      recordId: '',
      record: null
    };
  },
  onLoad(options) {
    this.recordId = options?.recordId || '';
    this.loadDetail();
  },
  methods: {
    async loadDetail() {
      if (!this.recordId) return;

      uni.showLoading({ title: '加载中...' });

      try {
        const res = await uniRequest({
          url: `http://localhost:3000/api/doctor/medicalRecord/detail/${this.recordId}`,
          method: 'GET'
        });

        if (res.code === 200) {
          this.record = res.data;
        } else {
          uni.showToast({ title: res.msg || '获取失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载病历详情失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

.detail-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-header {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #4facfe;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.info-section {
  margin-bottom: 30rpx;
}

.info-row {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.section {
  margin-bottom: 30rpx;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #4facfe;
  margin-bottom: 16rpx;
  display: block;
}

.section-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

.section-content.diagnosis {
  color: #ff6b6b;
  font-weight: bold;
}
</style>
