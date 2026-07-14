<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="header-title">支付</text>
      </view>
    </view>

    <view class="content" v-if="order">
      <view class="order-card">
        <view class="order-info">
          <text class="order-id">订单号：{{ order.id }}</text>
          <text class="order-time">{{ formatDateTime(order.order_time) }}</text>
        </view>
      </view>

      <view class="drug-card">
        <view class="drug-image">
          <text class="image-placeholder">💊</text>
        </view>
        <view class="drug-info">
          <text class="drug-name">{{ order.drug_name }}</text>
          <text class="drug-spec">¥{{ order.drug_price }} × {{ order.quantity }}</text>
        </view>
      </view>

      <view class="pay-card">
        <view class="pay-info">
          <text class="pay-label">应付金额</text>
          <text class="pay-amount">¥{{ order.total_price }}</text>
        </view>
      </view>

      <view class="tips-card">
        <text class="tips-title">💡 温馨提示</text>
        <text class="tips-content">此支付为模拟支付，不涉及真实资金交易</text>
      </view>
    </view>

    <view class="bottom-bar" v-if="order">
      <view class="cancel-btn" @click="cancelOrder">
        <text>取消订单</text>
      </view>
      <view class="amount-info">
        <text class="amount-label">应付金额</text>
        <text class="amount-value">¥{{ order.total_price }}</text>
      </view>
      <view 
        :class="['pay-btn', { loading: isLoading }]" 
        @click="simulatePay"
        :disabled="isLoading"
      >
        {{ isLoading ? '支付中...' : '模拟支付' }}
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
      order: null,
      orderId: null,
      isLoading: false
    };
  },
  onLoad(options) {
    this.orderId = options?.orderId;
    this.loadOrderDetail();
  },
  methods: {
    async loadOrderDetail() {
      if (!this.orderId) return;
      
      try {
        const res = await uniRequest({
          url: `http://localhost:3000/api/drug/order/detail/${this.orderId}`,
          method: 'GET'
        });
        if (res.code === 200) {
          this.order = res.data;
        }
      } catch (error) {
        console.error('加载订单失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    async cancelOrder() {
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
                  orderId: this.orderId
                }
              });
              if (result.code === 200) {
                uni.showToast({ title: '取消成功', icon: 'success' });
                setTimeout(() => {
                  uni.navigateBack();
                }, 1500);
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

    async simulatePay() {
      if (!this.orderId || this.isLoading) return;

      this.isLoading = true;

      try {
        const res = await uniRequest({
          url: `http://localhost:3000/api/drug/order/simulatePay/${this.orderId}`,
          method: 'POST'
        });

        if (res.code === 200) {
          uni.showToast({ title: '支付成功', icon: 'success' });
          setTimeout(() => {
            uni.switchTab({ url: '/pages/student/home' });
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '支付失败', icon: 'none' });
        }
      } catch (error) {
        console.error('支付失败:', error);
        uni.showToast({ title: '支付失败', icon: 'none' });
      } finally {
        this.isLoading = false;
      }
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
  padding-bottom: 140rpx;
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
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-id {
  font-size: 28rpx;
  color: #333;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.drug-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.drug-image {
  width: 120rpx;
  height: 120rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.image-placeholder {
  font-size: 48rpx;
}

.drug-info {
  flex: 1;
}

.drug-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.drug-spec {
  font-size: 26rpx;
  color: #999;
}

.pay-card {
  background: linear-gradient(135deg, #fff8f0 0%, #fff0e6 100%);
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #ffe0cc;
}

.pay-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.pay-label {
  font-size: 30rpx;
  color: #666;
}

.pay-amount {
  font-size: 52rpx;
  font-weight: bold;
  color: #ff4757;
}

.tips-card {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 12rpx;
}

.tips-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.cancel-btn {
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-info {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff4757;
}

.pay-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
  color: #fff;
  padding: 28rpx 80rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.pay-btn.loading {
  opacity: 0.7;
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