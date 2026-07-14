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

    <view class="appointment-list" v-if="filteredAppointments.length > 0">
      <view
        v-for="item in filteredAppointments"
        :key="item.id"
        class="appointment-card"
      >
        <view class="card-header">
          <text class="department">{{ item.department_name }}</text>
          <text class="status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">医生：</text>
            <text class="value">{{ item.doctor_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">日期：</text>
            <text class="value">{{ formatDate(item.date) }}</text>
          </view>
          <view class="info-row">
            <text class="label">时段：</text>
            <text class="value">{{ item.time_slot }}</text>
          </view>
          <view class="info-row">
            <text class="label">挂号费：</text>
            <text class="value fee-value">¥{{ item.fee || '10.00' }}</text>
          </view>
          <view v-if="item.symptom" class="info-row">
            <text class="label">症状：</text>
            <text class="value symptom-text">{{ item.symptom }}</text>
          </view>
        </view>
        <view class="card-footer">
          <view class="create-time">{{ formatDateTime(item.create_time) }}</view>
          <button
            v-if="item.status === 0"
            class="cancel-btn"
            @click="showCancelConfirm(item)"
          >
            <text>取消预约</text>
          </button>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无{{ activeTabLabel }}预约</text>
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
      appointments: [],
      userInfo: null
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadAppointments();
  },
  computed: {
    filteredAppointments() {
      switch (this.activeTab) {
        case 'pending':
          return this.appointments.filter(item => item.status === 0);
        case 'completed':
          return this.appointments.filter(item => item.status === 1);
        case 'cancelled':
          return this.appointments.filter(item => item.status === 2);
        default:
          return this.appointments;
      }
    },
    activeTabLabel() {
      return this.tabs.find(t => t.value === this.activeTab)?.label || '';
    }
  },
  methods: {
    async loadAppointments() {
      if (!this.userInfo?.username) return;

      uni.showLoading({ title: '加载中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/appointments',
          method: 'GET',
          data: { studentId: this.userInfo.username }
        });

        uni.hideLoading();

        if (res.code === 200) {
          this.appointments = res.data;
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('加载预约失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
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

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
    },

    formatDateTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    showCancelConfirm(appointment) {
      uni.showModal({
        title: '确认取消',
        content: `取消预约将退还 ¥${appointment.fee || '10.00'}，确认取消吗？`,
        confirmColor: '#667eea',
        success: async (res) => {
          if (res.confirm) {
            await this.cancelAppointment(appointment.id);
          }
        }
      });
    },

    async cancelAppointment(appointmentId) {
      uni.showLoading({ title: '取消中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/cancelAppointment',
          method: 'POST',
          data: { appointmentId }
        });

        uni.hideLoading();

        if (res.code === 200) {
          uni.showToast({ title: '已取消，费用已退还', icon: 'success' });
          this.loadAppointments();
        } else {
          uni.showToast({ title: res.msg || '取消失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('取消预约失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
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
  position: sticky;
  top: 0;
  z-index: 10;
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
  color: #667eea;
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
  background: #667eea;
  border-radius: 2rpx;
}

.appointment-list {
  padding: 20rpx 30rpx;
}

.appointment-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
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
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
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
  flex: 1;
}

.symptom-text {
  color: #666;
  line-height: 1.4;
}

.fee-value {
  color: #ff6b6b;
  font-weight: bold;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.create-time {
  font-size: 24rpx;
  color: #999;
}

.cancel-btn {
  padding: 12rpx 32rpx;
  background: #fff;
  border-radius: 32rpx;
  border: 1rpx solid #667eea;
  font-size: 24rpx;
  color: #667eea;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>