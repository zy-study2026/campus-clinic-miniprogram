<template>
  <view class="container safe-area-top">
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>
    
    <view class="appoint-list">
      <view 
        v-for="item in filteredAppoints" 
        :key="item.id"
        class="appoint-card"
      >
        <view class="card-header">
          <text class="department">{{ item.department_name }}</text>
          <text class="status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</text>
        </view>
        
        <view class="card-body">
          <view class="info-row">
            <text class="label">学生：</text>
            <text class="value">{{ item.student_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">医生：</text>
            <text class="value">{{ item.doctor_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">日期：</text>
            <text class="value">{{ item.date }}</text>
          </view>
          <view class="info-row">
            <text class="label">时段：</text>
            <text class="value">{{ item.time_slot }}</text>
          </view>
          <view class="info-row">
            <text class="label">挂号费：</text>
            <text class="value fee-value">¥{{ item.fee || '10.00' }}</text>
          </view>
        </view>
        
        <view class="card-footer">
          <text class="create-time">{{ formatTime(item.create_time) }}</text>
        </view>
      </view>
    </view>
    
    <view v-if="filteredAppoints.length === 0" class="empty-state">
      <text class="empty-icon">📅</text>
      <text class="empty-text">暂无{{ tabs.find(t => t.value === activeTab)?.label }}预约</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      tabs: [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待就诊' },
        { value: 'completed', label: '已就诊' },
        { value: 'cancelled', label: '已取消' }
      ],
      activeTab: 'all',
      appoints: []
    };
  },
  onShow() {
    this.loadAppoints();
  },
  computed: {
    filteredAppoints() {
      switch (this.activeTab) {
        case 'pending':
          return this.appoints.filter(item => item.status === 0);
        case 'completed':
          return this.appoints.filter(item => item.status === 1);
        case 'cancelled':
          return this.appoints.filter(item => item.status === 2);
        default:
          return this.appoints;
      }
    }
  },
  methods: {
    async loadAppoints() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/appointments',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          this.appoints = res.data;
        }
      } catch (error) {
        console.error('加载预约失败:', error);
      }
    },
    
    getStatusClass(status) {
      switch (status) {
        case 0: return 'status-pending';
        case 1: return 'status-completed';
        case 2: return 'status-cancelled';
        default: return '';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 0: return '待就诊';
        case 1: return '已就诊';
        case 2: return '已取消';
        default: return '未知';
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
}

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #43e97b;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #43e97b;
  border-radius: 2rpx;
}

.appoint-list {
  padding: 20rpx 30rpx;
}

.appoint-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.department {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  padding: 16rpx 0;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 26rpx;
  color: #999;
  width: 100rpx;
}

.value {
  font-size: 26rpx;
  color: #333;
}

.fee-value {
  color: #ff6b6b;
  font-weight: bold;
}

.card-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.create-time {
  font-size: 24rpx;
  color: #999;
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
