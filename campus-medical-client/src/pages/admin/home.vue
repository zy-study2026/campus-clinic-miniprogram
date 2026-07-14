<template>
  <view class="container safe-area-top">
    <view class="welcome">
      <text class="greeting">你好，{{ userInfo?.name }}</text>
      <text class="subtitle">欢迎管理校园医务室</text>
    </view>
    
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-icon">👨‍🎓</text>
        <text class="stat-value">{{ studentCount }}</text>
        <text class="stat-label">学生总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-icon">👨‍⚕️</text>
        <text class="stat-value">{{ doctorCount }}</text>
        <text class="stat-label">医生总数</text>
      </view>
    </view>
    
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-icon">📅</text>
        <text class="stat-value">{{ todayAppointments }}</text>
        <text class="stat-label">今日预约</text>
      </view>
      <view class="stat-card">
        <text class="stat-icon">📋</text>
        <text class="stat-value">{{ totalRecords }}</text>
        <text class="stat-label">病历总数</text>
      </view>
    </view>
    
    <view class="menu-section">
      <view class="menu-row">
        <view class="menu-item" @tap="goToStudentManage">
          <view class="menu-icon">👥</view>
          <text class="menu-text">学生管理</text>
        </view>
        <view class="menu-item" @tap="goToDoctorManage">
          <view class="menu-icon">👨‍⚕️</view>
          <text class="menu-text">医生管理</text>
        </view>
        <view class="menu-item" @tap="goToDepartmentManage">
          <view class="menu-icon">🏥</view>
          <text class="menu-text">科室管理</text>
        </view>
      </view>
      <view class="menu-row">
        <view class="menu-item" @tap="goToDutyManage">
          <view class="menu-icon">📅</view>
          <text class="menu-text">排班管理</text>
        </view>
        <view class="menu-item" @tap="goToDrugManage">
          <view class="menu-icon">💊</view>
          <text class="menu-text">药品管理</text>
        </view>
        <view class="menu-item" @tap="goToOrderManage">
          <view class="menu-icon">📦</view>
          <text class="menu-text">订单管理</text>
        </view>
      </view>
      <view class="menu-row">
        <view class="menu-item" @tap="goToAnnouncement">
          <view class="menu-icon">📢</view>
          <text class="menu-text">公告管理</text>
        </view>
        <view class="menu-item" @tap="goToProfile">
          <view class="menu-icon">👤</view>
          <text class="menu-text">个人中心</text>
        </view>
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
      studentCount: 0,
      doctorCount: 0,
      todayAppointments: 0,
      totalRecords: 0
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/stats',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          const data = res.data;
          this.studentCount = data.student_count || 0;
          this.doctorCount = data.doctor_count || 0;
          this.todayAppointments = data.today_appointments || 0;
          this.totalRecords = data.total_records || 0;
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },
    
    goToStudentManage() {
      uni.navigateTo({ url: '/pages/admin/student-manage' });
    },
    
    goToDoctorManage() {
      uni.navigateTo({ url: '/pages/admin/doctor-manage' });
    },
    
    goToDepartmentManage() {
      uni.navigateTo({ url: '/pages/admin/department-manage' });
    },
    
    goToDutyManage() {
      uni.navigateTo({ url: '/pages/admin/duty-manage' });
    },
    
    goToDrugManage() {
      uni.navigateTo({ url: '/pages/admin/drug-manage' });
    },
    
    goToOrderManage() {
      uni.navigateTo({ url: '/pages/admin/order-manage' });
    },
    
    goToAnnouncement() {
      uni.navigateTo({ url: '/pages/admin/announcement-manage' });
    },
    
    goToProfile() {
      uni.navigateTo({ url: '/pages/admin/profile' });
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

.welcome {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.greeting {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon {
  font-size: 50rpx;
  margin-bottom: 16rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.menu-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
}

.menu-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.menu-row:last-child {
  margin-bottom: 0;
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.menu-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}
</style>