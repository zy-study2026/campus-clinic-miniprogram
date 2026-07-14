<template>
  <view class="container">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: activeTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="order-list" v-if="orders.length > 0">
      <view v-for="order in orders" :key="order.id" class="order-card">
        <view class="order-header">
          <text class="order-id">订单号：{{ order.id }}</text>
          <text :class="['order-status', `status-${order.status}`]">{{ order.statusText }}</text>
        </view>

        <view class="drug-item" @click="goToDetail(order.id)">
          <view class="drug-image">
            <text class="image-placeholder">💊</text>
          </view>
          <view class="drug-info">
            <text class="drug-name">{{ order.drug_name }}</text>
            <text class="drug-spec">¥{{ order.drug_price }} × {{ order.quantity }}</text>
          </view>
          <text class="order-total">¥{{ order.total_price }}</text>
        </view>

        <view class="order-time">下单时间：{{ formatDateTime(order.order_time) }}</view>

        <view class="order-actions" v-if="order.status === 0">
          <view class="action-btn cancel" @click="cancelOrder(order.id)">取消订单</view>
          <view class="action-btn pay" @click="goToPayment(order.id)">继续支付</view>
        </view>

        <view class="order-actions" v-if="order.status === 3">
          <view class="action-btn detail" @click="goToDetail(order.id)">查看详情</view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无订单</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      orders: [],
      activeTab: 'all',
      tabs: [
        { label: '全部', value: 'all' },
        { label: '待支付', value: '0' },
        { label: '已支付', value: '1' },
        { label: '配送中', value: '2' },
        { label: '已完成', value: '3' },
        { label: '已取消', value: '4' }
      ],
      userInfo: null
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadOrders();
  },
  methods: {
    switchTab(tabValue) {
      this.activeTab = tabValue;
      this.loadOrders();
    },

    async loadOrders() {
      if (!this.userInfo?.username) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      const requestData = {
        studentId: this.userInfo.username
      };

      if (this.activeTab !== 'all') {
        requestData.status = this.activeTab;
      }

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/drug/student/orders',
          method: 'GET',
          data: requestData
        });
        if (res.code === 200) {
          this.orders = res.data;
        }
      } catch (error) {
        console.error('加载订单失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    async cancelOrder(orderId) {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消此订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniRequest({
                url: 'http://localhost:3000/api/drug/order/cancel',
                method: 'POST',
                data: {
                  orderId: orderId
                }
              });
              if (result.code === 200) {
                uni.showToast({ title: '取消成功', icon: 'success' });
                this.loadOrders();
              } else {
                uni.showToast({ title: result.msg || '取消失败', icon: 'none' });
              }
            } catch (error) {
              console.error('取消订单失败:', error);
              uni.showToast({ title: '取消失败', icon: 'none' });
            }
          }
        }
      });
    },

    goToPayment(orderId) {
      uni.navigateTo({
        url: `/pages/student/payment?orderId=${orderId}`
      });
    },

    goToDetail(orderId) {
      uni.navigateTo({
        url: `/pages/student/order-detail?id=${orderId}`
      });
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
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
  padding: 20rpx 0;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  flex: 0 0 auto;
  padding: 16rpx 32rpx;
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

.order-list {
  padding: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.order-id {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 26rpx;
  font-weight: bold;
}

.order-status.status-0 {
  color: #ff6b6b;
}

.order-status.status-1 {
  color: #52c41a;
}

.order-status.status-2 {
  color: #faad14;
}

.order-status.status-3 {
  color: #667eea;
}

.order-status.status-4 {
  color: #999;
}

.drug-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
}

.drug-image {
  width: 100rpx;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.image-placeholder {
  font-size: 40rpx;
}

.drug-info {
  flex: 1;
}

.drug-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.drug-spec {
  font-size: 24rpx;
  color: #999;
}

.order-total {
  font-size: 30rpx;
  font-weight: bold;
  color: #ff4757;
}

.order-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.action-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.action-btn.pay {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
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