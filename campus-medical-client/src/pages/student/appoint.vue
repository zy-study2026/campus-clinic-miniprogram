<template>
  <view class="container safe-area-top">
    <view class="header">
      <text class="header-title">{{ headerTitle }}</text>
    </view>

    <view class="department-list" v-if="!selectedDept">
      <view
        v-for="dept in departments"
        :key="dept.id"
        class="dept-card"
        @click="selectDepartment(dept)"
      >
        <view class="dept-icon">🏥</view>
        <view class="dept-info">
          <text class="dept-name">{{ dept.name }}</text>
          <text class="dept-desc">{{ dept.description || '点击选择该科室医生' }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="doctor-section" v-if="selectedDept && !selectedDoctor">
      <view class="section-header">
        <text class="back-btn" @click="goBack">返回科室</text>
      </view>

      <view class="doctor-list">
        <view
          v-for="doctor in doctors"
          :key="doctor.id"
          class="doctor-card"
          @click="selectDoctor(doctor)"
        >
          <view class="doctor-avatar">{{ doctor.name.charAt(0) }}</view>
          <view class="doctor-info">
            <text class="doctor-name">{{ doctor.name }}</text>
            <text class="doctor-dept">{{ selectedDept.name }}</text>
          </view>
          <text class="select-btn">选择</text>
        </view>
        <view v-if="doctors.length === 0" class="empty-tip">
          <text>该科室暂无医生排班</text>
        </view>
      </view>
    </view>

    <view class="schedule-section" v-if="selectedDoctor">
      <view class="section-header">
        <text class="back-btn" @click="goBackToDoctors">返回医生列表</text>
      </view>

      <view class="date-list">
        <view
          v-for="date in availableDates"
          :key="date.value"
          class="date-item"
          :class="{ active: selectedDate === date.value }"
          @click="selectDate(date.value)"
        >
          <text class="date-week">{{ date.week }}</text>
          <text class="date-day">{{ date.day }}</text>
        </view>
      </view>

      <view class="time-section" v-if="selectedDate">
        <text class="time-title">选择时段</text>
        <view class="time-list" v-if="availableTimes.length > 0">
          <view
            v-for="time in availableTimes"
            :key="time.id"
            class="time-item"
          :class="{ active: selectedTime?.id === time.id, disabled: time.remaining <= 0 }"
          @click="selectTime(time)"
        >
            <view class="time-slot">
              <text class="slot-name">{{ time.time_slot }}</text>
              <text class="slot-status" :class="{ full: time.remaining <= 0 }">
                {{ time.remaining > 0 ? `剩余 ${time.remaining}` : '已满' }}
              </text>
            </view>
          </view>
        </view>
        <view v-else class="empty-tip">
          <text>该日期暂无可用时段</text>
        </view>
      </view>

      <view class="symptom-section">
        <text class="symptom-title">症状描述（选填）</text>
        <textarea
          v-model="symptom"
          class="symptom-input"
          placeholder="请简要描述您的症状，如：头痛、发热、咳嗽等"
        />
      </view>

      <view class="fee-section">
        <text class="fee-label">挂号费：</text>
        <text class="fee-value">¥10.00</text>
      </view>

      <button
        class="submit-btn"
        @click="confirmAppointment"
        :disabled="!canSubmit"
      >
        <text>确认预约</text>
      </button>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      departments: [],
      doctors: [],
      availableDates: [],
      availableTimes: [],
      selectedDept: null,
      selectedDoctor: null,
      selectedDate: null,
      selectedTime: null,
      symptom: '',
      userInfo: null
    };
  },
  onLoad() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadDepartments();
    this.initDates();
  },
  computed: {
    canSubmit() {
      return this.selectedDept && this.selectedDoctor && this.selectedDate && this.selectedTime;
    },
    headerTitle() {
      if (this.selectedDoctor) {
        return `${this.selectedDoctor.name} - 选择时间`;
      } else if (this.selectedDept) {
        return `${this.selectedDept.name} - 医生列表`;
      } else {
        return '选择科室';
      }
    }
  },
  methods: {
    async loadDepartments() {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/departments',
          method: 'GET'
        });
        if (res.code === 200) {
          this.departments = res.data;
        }
      } catch (error) {
        console.error('加载科室失败:', error);
        uni.showToast({ title: '加载科室失败', icon: 'none' });
      }
    },

    async loadDoctors(deptId) {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/doctors/byDepartment',
          method: 'GET',
          data: { deptId }
        });
        if (res.code === 200) {
          this.doctors = res.data;
        }
      } catch (error) {
        console.error('加载医生失败:', error);
        uni.showToast({ title: '加载医生失败', icon: 'none' });
      }
    },

    async loadAvailableTimes() {
      if (!this.selectedDoctor || !this.selectedDate) return;

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/duty/available',
          method: 'GET',
          data: {
            doctorId: this.selectedDoctor.id,
            date: this.selectedDate
          }
        });
        if (res.code === 200) {
          this.availableTimes = res.data;
        } else {
          this.availableTimes = [];
        }
      } catch (error) {
        console.error('加载时段失败:', error);
        this.availableTimes = [];
      }
    },

    initDates() {
      const dates = [];
      const today = new Date();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push({
          value: date.toISOString().split('T')[0],
          week: `周${weekDays[date.getDay()]}`,
          day: `${date.getMonth() + 1}/${date.getDate()}`
        });
      }

      this.availableDates = dates;
      this.selectedDate = dates[0].value;
    },

    selectDepartment(dept) {
      this.selectedDept = dept;
      this.selectedDoctor = null;
      this.selectedTime = null;
      this.availableTimes = [];
      this.loadDoctors(dept.id);
    },

    selectDoctor(doctor) {
      this.selectedDoctor = doctor;
      this.selectedTime = null;
      this.loadAvailableTimes();
    },

    selectDate(date) {
      this.selectedDate = date;
      this.selectedTime = null;
      this.loadAvailableTimes();
    },

    selectTime(time) {
      if (time.remaining <= 0) return;
      this.selectedTime = time;
    },

    goBack() {
      this.selectedDept = null;
      this.selectedDoctor = null;
      this.doctors = [];
      this.availableTimes = [];
    },

    goBackToDoctors() {
      this.selectedDoctor = null;
      this.selectedTime = null;
      this.availableTimes = [];
    },

    confirmAppointment() {
      uni.showModal({
        title: '确认预约',
        content: '需支付 ¥10.00，确认预约吗？',
        confirmText: '确认支付',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.submitAppointment();
          }
        }
      });
    },

    async submitAppointment() {
      if (!this.selectedTime) {
        uni.showToast({ title: '请先选择预约时段', icon: 'none' });
        return;
      }

      if (!this.canSubmit) {
        uni.showToast({ title: '请选择完整预约信息', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '预约中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/student/appointment',
          method: 'POST',
          data: {
            studentId: this.userInfo?.username,
            dutyId: this.selectedTime.id,
            symptom: this.symptom
          }
        });

        uni.hideLoading();

        if (res.code === 200) {
          uni.showToast({ title: '预约成功', icon: 'success' });
          setTimeout(() => {
            uni.switchTab({ url: '/pages/student/my-appoint' });
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '预约失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
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
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.department-list {
  padding: 20rpx 30rpx;
}

.dept-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.dept-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 24rpx;
}

.dept-info {
  flex: 1;
}

.dept-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.dept-desc {
  font-size: 24rpx;
  color: #999;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.back-btn {
  font-size: 26rpx;
  color: #667eea;
}

.doctor-section,
.schedule-section {
  background: #fff;
}

.doctor-list {
  padding: 20rpx 30rpx;
}

.doctor-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #f9f9f9;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.doctor-avatar {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
  margin-right: 24rpx;
}

.doctor-info {
  flex: 1;
}

.doctor-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.doctor-dept {
  font-size: 24rpx;
  color: #999;
}

.select-btn {
  padding: 12rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #fff;
}

.date-list {
  display: flex;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.date-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  margin-right: 12rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.date-item:last-child {
  margin-right: 0;
}

.date-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.date-week {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.date-day {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.date-item.active .date-week,
.date-item.active .date-day {
  color: #fff;
}

.time-section {
  padding: 30rpx;
}

.time-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.time-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.time-item {
  width: calc(50% - 10rpx);
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
}

.time-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.time-item.disabled {
  opacity: 0.5;
}

.slot-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.time-item.active .slot-name {
  color: #fff;
}

.slot-status {
  font-size: 24rpx;
  color: #52c41a;
}

.slot-status.full {
  color: #ff4d4f;
}

.time-item.active .slot-status {
  color: rgba(255, 255, 255, 0.8);
}

.symptom-section {
  padding: 30rpx;
}

.symptom-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.symptom-input {
  width: 100%;
  height: 200rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.empty-tip {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.fee-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  margin: 0 30rpx 200rpx;
  border-radius: 16rpx;
}

.fee-label {
  font-size: 28rpx;
  color: #666;
}

.fee-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.submit-btn {
  position: fixed;
  bottom: 30rpx;
  left: 30rpx;
  right: 30rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 48rpx;
  border: none;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>