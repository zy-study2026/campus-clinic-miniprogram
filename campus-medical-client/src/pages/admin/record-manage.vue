<template>
  <view class="container safe-area-top">
    <view class="search-bar">
      <input 
        v-model="searchText" 
        class="search-input" 
        placeholder="搜索学生姓名..."
      />
      <button class="search-btn" @click="searchRecords">
        <text>搜索</text>
      </button>
    </view>
    
    <view class="record-list">
      <view 
        v-for="record in filteredRecords" 
        :key="record.id"
        class="record-card"
      >
        <view class="card-header">
          <view class="header-left">
            <text class="student-name">👨‍🎓 {{ record.student_name }}</text>
            <text class="record-date">{{ formatDate(record.record_time) }}</text>
          </view>
          <text class="doctor-name">👨‍⚕️ {{ record.doctor_name }}</text>
        </view>
        
        <view class="card-body">
          <view v-if="record.diagnosis" class="diagnosis">
            <text class="diagnosis-label">诊断：</text>
            <text class="diagnosis-value">{{ record.diagnosis }}</text>
          </view>
          
          <view v-if="record.treatment" class="treatment">
            <text class="treatment-label">处理：</text>
            <text class="treatment-value">{{ record.treatment }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="filteredRecords.length === 0" class="empty-state">
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
      searchText: ''
    };
  },
  onShow() {
    this.loadRecords();
  },
  computed: {
    filteredRecords() {
      if (!this.searchText) return this.records;
      const keyword = this.searchText.toLowerCase();
      return this.records.filter(r => 
        r.student_name.toLowerCase().includes(keyword) ||
        r.doctor_name.toLowerCase().includes(keyword)
      );
    }
  },
  methods: {
    async loadRecords() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/medical-records',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          this.records = res.data;
        }
      } catch (error) {
        console.error('加载病历失败:', error);
      }
    },
    
    searchRecords() {
    },
    
    formatDate(timeStr) {
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

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.search-btn {
  padding: 0 32rpx;
  background: #43e97b;
  border-radius: 12rpx;
  border: none;
  color: #fff;
  font-size: 28rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.record-date {
  font-size: 24rpx;
  color: #999;
}

.doctor-name {
  font-size: 26rpx;
  color: #666;
}

.card-body {
  padding: 16rpx 0;
}

.diagnosis {
  margin-bottom: 16rpx;
}

.diagnosis-label {
  font-size: 26rpx;
  color: #999;
}

.diagnosis-value {
  font-size: 28rpx;
  color: #43e97b;
  font-weight: 500;
}

.treatment {
  margin-bottom: 16rpx;
}

.treatment-label {
  font-size: 26rpx;
  color: #999;
}

.treatment-value {
  font-size: 28rpx;
  color: #333;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
