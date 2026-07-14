<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="header-title">订单详情</text>
      </view>
    </view>

    <view class="content" v-if="order">
      <view class="status-card">
        <text :class="['status-text', order.status]">{{ order.statusText }}</text>
        <text class="order-id">订单号：{{ order.id }}</text>
      </view>

      <view class="info-card">
        <text class="card-title">📦 商品信息</text>
        <view class="drug-item">
          <view class="drug-image">
            <text class="image-placeholder">💊</text>
          </view>
          <view class="drug-info">
            <text class="drug-name">{{ order.drug_name }}</text>
            <text class="drug-price">¥{{ order.drug_price }}</text>
          </view>
          <text class="drug-quantity">×{{ order.quantity }}</text>
        </view>
        <view class="total-row">
          <text class="total-label">商品金额</text>
          <text class="total-value">¥{{ order.total_price }}</text>
        </view>
      </view>

      <view class="info-card">
        <text class="card-title">📍 收货信息</text>
        <view class="address-item">
          <text class="receiver-name">{{ order.receiver_name }}</text>
          <text class="receiver-phone">{{ order.receiver_phone }}</text>
        </view>
        <text class="receiver-address">{{ order.receiver_address }}</text>
      </view>

      <view class="info-card">
        <text class="card-title">⏰ 时间信息</text>
        <view class="time-row">
          <text class="time-label">下单时间</text>
          <text class="time-value">{{ formatDateTime(order.order_time) }}</text>
        </view>
        <view class="time-row" v-if="order.pay_time">
          <text class="time-label">支付时间</text>
          <text class="time-value">{{ formatDateTime(order.pay_time) }}</text>
        </view>
        <view class="time-row" v-if="order.delivery_estimate_time">
          <text class="time-label">预计送达</text>
          <text class="time-value">{{ formatDate(order.delivery_estimate_time) }}</text>
        </view>
      </view>

      <view class="info-card">
        <text class="card-title">📞 联系我们</text>
        <view class="contact-item">
          <text class="contact-label">医务室电话</text>
          <text class="contact-value">{{ order.clinicPhone }}</text>
        </view>
      </view>

      <view class="order-actions" v-if="order.status === 0">
        <view class="action-btn cancel" @click="cancelOrder">取消订单</view>
        <view class="action-btn pay" @click="goToPayment">继续支付</view>
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
      orderId: null
    };
  },
  onLoad(options) {
    this.orderId = options?.id;
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
        console.error('加载订单详情失败:', error);
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
                url: `http://localhost:3000/api/drug/order/cancel/${this.orderId}`,
                method: 'POST'
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

    goToPayment() {
      uni.navigateTo({
        url: `/pages/student/payment?orderId=${this.orderId}`
      });
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.status-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 12rpx;
}

.order-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.drug-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
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
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.drug-price {
  font-size: 26rpx;
  color: #ff4757;
}

.drug-quantity {
  font-size: 28rpx;
  color: #999;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0 10rpx;
}

.total-label {
  font-size: 28rpx;
  color: #666;
}

.total-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4757;
}

.address-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.receiver-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.receiver-phone {
  font-size: 28rpx;
  color: #666;
}

.receiver-address {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.time-label {
  font-size: 28rpx;
  color: #666;
}

.time-value {
  font-size: 28rpx;
  color: #333;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-label {
  font-size: 28rpx;
  color: #666;
}

.contact-value {
  font-size: 28rpx;
  color: #667eea;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  text-align: center;
}

.action-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.action-btn.pay {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
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