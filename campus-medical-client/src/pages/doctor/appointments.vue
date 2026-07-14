<template>
  <view class="container safe-area-top">
    <view class="filter-bar">
      <picker mode="date" :value="selectedDate" @change="onDateChange">
        <view class="date-picker">
          <text>{{ selectedDate || '选择日期' }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
      <view class="filter-btn" @tap="loadAppointments">
        <text>筛选</text>
      </view>
    </view>

    <view class="filter-tabs">
      <view
        v-for="tab in statusTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: selectedStatus === tab.value }"
        @tap="onStatusChange(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <view class="list-container">
      <view class="appointment-item" v-for="item in appointments" :key="item.id">
        <view class="item-header">
          <text class="student-name">{{ item.student_name }}</text>
          <text :class="['status-tag', `status-${item.status}`]">{{ item.statusText }}</text>
        </view>
        <view class="item-content">
          <view class="info-row">
            <text class="info-label">学号：</text>
            <text class="info-value">{{ item.student_username }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">性别：</text>
            <text class="info-value">{{ getGenderText(item.student_gender) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">电话：</text>
            <text class="info-value">{{ item.student_phone }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">科室：</text>
            <text class="info-value">{{ item.department_name }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">就诊日期：</text>
            <text class="info-value">{{ item.date }} {{ item.time_slot }}</text>
          </view>
          <view class="info-row" v-if="item.symptom">
            <text class="info-label">症状：</text>
            <text class="info-value">{{ item.symptom }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">挂号费：</text>
            <text class="info-value fee-value">¥{{ item.fee || '10.00' }}</text>
          </view>
        </view>
        <view class="item-footer" v-if="item.status === 0">
          <button class="action-btn" @tap="goToMedicalRecord(item)">
            <text>确认就诊并填写病历</text>
          </button>
        </view>
      </view>

      <view class="empty-state" v-if="appointments.length === 0">
        <text class="empty-icon">📅</text>
        <text class="empty-text">暂无预约记录</text>
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
      appointments: [],
      selectedDate: '',
      selectedStatus: 0,
      statusTabs: [
        { label: '待就诊', value: 0 },
        { label: '已就诊', value: 1 },
        { label: '已取消', value: 2 }
      ]
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadAppointments();
  },
  methods: {
    getGenderText(gender) {
      if (gender === undefined || gender === null) return '未知';
      return gender === 1 ? '女' : '男';
    },

    async loadAppointments() {
      if (!this.userInfo?.id) return;

      uni.showLoading({ title: '加载中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/appointments',
          method: 'GET',
          data: {
            doctorId: this.userInfo.id,
            date: this.selectedDate,
            status: this.selectedStatus
          }
        });

        if (res.code === 200) {
          this.appointments = res.data;
        }
      } catch (error) {
        console.error('加载预约列表失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    onDateChange(e) {
      this.selectedDate = e.detail.value;
    },

    onStatusChange(status) {
      this.selectedStatus = status;
      this.loadAppointments();
    },

    goToMedicalRecord(appointment) {
      const params = [
        `appointmentId=${appointment.id}`,
        `studentName=${encodeURIComponent(appointment.student_name)}`,
        `studentGender=${appointment.student_gender}`,
        `studentBirthDate=${appointment.student_birth_date || ''}`,
        `studentUsername=${encodeURIComponent(appointment.student_username || '')}`,
        `date=${encodeURIComponent(appointment.date + ' ' + appointment.time_slot)}`
      ].join('&');

      uni.navigateTo({
        url: `/pages/doctor/medical-record-form?${params}`
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

.filter-bar {
  display: flex;
  padding: 20rpx 30rpx;
  background: #fff;
  gap: 20rpx;
}

.date-picker {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #333;
}

.arrow {
  font-size: 20rpx;
  color: #999;
}

.filter-btn {
  background: #4facfe;
  color: #fff;
  padding: 20rpx 30rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.filter-tabs {
  display: flex;
  background: #fff;
  padding: 0 20rpx 20rpx;
  gap: 10rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.tab-item.active {
  background: #4facfe;
  color: #fff;
}

.list-container {
  padding: 20rpx 30rpx;
}

.appointment-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.student-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.status-tag.status-0 {
  background: #fff3e0;
  color: #ff9800;
}

.status-tag.status-1 {
  background: #e3f2fd;
  color: #2196f3;
}

.status-tag.status-2 {
  background: #e8f5e9;
  color: #4caf50;
}

.status-tag.status-3 {
  background: #f5f5f5;
  color: #999;
}

.item-content {
  padding: 0 0 20rpx 0;
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

.fee-value {
  color: #ff6b6b;
  font-weight: bold;
}

.item-footer {
  padding-top: 20rpx;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  background: #4facfe;
  color: #fff;
  font-size: 26rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.action-btn.secondary {
  background: #fff;
  color: #4facfe;
  border: 2rpx solid #4facfe;
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
