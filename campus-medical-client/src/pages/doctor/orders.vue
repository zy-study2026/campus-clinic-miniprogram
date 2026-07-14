<template>
  <view class="container safe-area-top">
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
      <view class="order-item" v-for="item in orders" :key="item.id">
        <view class="item-header">
          <text class="order-no">订单号：{{ item.id }}</text>
          <text :class="['order-status', `status-${item.status}`]">{{ item.statusText }}</text>
        </view>
        <view class="item-content">
          <view class="drug-info">
            <text class="drug-name">{{ item.drug_name }}</text>
            <text class="drug-quantity">×{{ item.quantity }}</text>
          </view>
          <view class="price-info">
            <text class="price">¥{{ item.total_price }}</text>
          </view>
        </view>
        <view class="item-detail">
          <view class="info-row">
            <text class="info-label">收货人：</text>
            <text class="info-value">{{ item.receiver_name }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">电话：</text>
            <text class="info-value">{{ item.receiver_phone }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">地址：</text>
            <text class="info-value">{{ item.receiver_address }}</text>
          </view>
        </view>
        <view class="item-footer">
          <view class="student-info">
            <text class="student-name">{{ item.student_name }}</text>
            <text class="student-no">{{ item.student_username }}</text>
          </view>
          <text class="order-time">{{ formatTime(item.order_time) }}</text>
        </view>
      </view>

      <view class="empty-state" v-if="orders.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无药品订单</text>
      </view>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      orders: [],
      selectedStatus: -1,
      statusTabs: [
        { label: '全部', value: -1 },
        { label: '待支付', value: 0 },
        { label: '已支付', value: 1 },
        { label: '配送中', value: 2 },
        { label: '已完成', value: 3 },
        { label: '已取消', value: 4 }
      ]
    };
  },
  onLoad() {
    this.loadOrders();
  },
  methods: {
    async loadOrders() {
      uni.showLoading({ title: '加载中...' });

      try {
        const data = { status: this.selectedStatus };
        if (this.selectedStatus === -1) {
          delete data.status;
        }

        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/orders',
          method: 'GET',
          data: data
        });

        if (res.code === 200) {
          this.orders = res.data;
        }
      } catch (error) {
        console.error('加载订单列表失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    onStatusChange(status) {
      this.selectedStatus = status;
      this.loadOrders();
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

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  padding: 20rpx;
  gap: 10rpx;
}

.tab-item {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
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

.order-item {
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

.order-no {
  font-size: 26rpx;
  color: #999;
}

.order-status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.order-status.status-0 {
  background: #fff3e0;
  color: #ff9800;
}

.order-status.status-1 {
  background: #e3f2fd;
  color: #2196f3;
}

.order-status.status-2 {
  background: #e8f5e9;
  color: #4caf50;
}

.order-status.status-3 {
  background: #f3e5f5;
  color: #9c27b0;
}

.order-status.status-4 {
  background: #f5f5f5;
  color: #999;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.drug-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.drug-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

.drug-quantity {
  font-size: 26rpx;
  color: #999;
}

.price {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.item-detail {
  padding: 16rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 24rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #999;
  width: 100rpx;
}

.info-value {
  color: #333;
  flex: 1;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
}

.student-info {
  display: flex;
  gap: 16rpx;
}

.student-name {
  font-size: 26rpx;
  color: #333;
}

.student-no {
  font-size: 24rpx;
  color: #999;
}

.order-time {
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
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
