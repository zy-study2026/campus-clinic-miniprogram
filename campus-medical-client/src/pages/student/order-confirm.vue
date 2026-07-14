<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="header-title">确认订单</text>
      </view>
    </view>

    <view class="content" v-if="drug">
      <view class="form-section">
        <text class="section-title">收货信息</text>
        <view class="form-item">
          <text class="label">收货人</text>
          <input class="input" v-model="receiverName" placeholder="请输入收货人姓名" />
        </view>
        <view class="form-item">
          <text class="label">联系电话</text>
          <input class="input" v-model="receiverPhone" placeholder="请输入联系电话" type="number" />
        </view>
        <view class="form-item">
          <text class="label">收货地址</text>
          <textarea class="textarea" v-model="receiverAddress" placeholder="请输入收货地址"></textarea>
        </view>
      </view>

      <view class="order-section">
        <text class="section-title">订单信息</text>
        <view class="drug-item" @click="goToDetail">
          <view class="drug-image">
            <text class="image-placeholder">💊</text>
          </view>
          <view class="drug-info">
            <text class="drug-name">{{ drug.name }}</text>
            <text class="drug-price">¥{{ drug.price }}</text>
          </view>
          <text class="drug-quantity">×{{ quantity }}</text>
        </view>
        <view class="stock-info" v-if="drug.stock > 0">
          <text class="stock-label">剩余库存：{{ drug.stock }} 件</text>
        </view>
        <view class="stock-warning" v-else>
          <text class="warning-icon">⚠️</text>
          <text class="warning-text">库存不足，无法下单</text>
        </view>
      </view>

      <view class="summary-section">
        <view class="summary-row">
          <text class="summary-label">商品金额</text>
          <text class="summary-value">¥{{ (drug.price * quantity).toFixed(2) }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">运费</text>
          <text class="summary-value">¥0.00</text>
        </view>
        <view class="summary-row total">
          <text class="summary-label">实付金额</text>
          <text class="summary-value">¥{{ (drug.price * quantity).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar" v-if="drug">
      <view class="total-info">
        <text class="total-label">实付款</text>
        <text class="total-amount">¥{{ (drug.price * quantity).toFixed(2) }}</text>
      </view>
      <view
        :class="['submit-btn', { disabled: drug.stock <= 0 }]"
        @click="submitOrder"
      >
        {{ drug.stock > 0 ? '提交订单' : '库存不足' }}
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
      drug: null,
      drugId: null,
      quantity: 1,
      receiverName: '',
      receiverPhone: '',
      receiverAddress: '',
      userInfo: null
    };
  },
  onLoad(options) {
    this.drugId = options?.id;
    this.quantity = parseInt(options?.quantity) || 1;
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadDrugDetail();
  },
  methods: {
    async loadDrugDetail() {
      if (!this.drugId) return;

      try {
        const res = await uniRequest({
          url: `http://localhost:3000/api/drug/detail/${this.drugId}`,
          method: 'GET'
        });
        if (res.code === 200) {
          this.drug = res.data;
        }
      } catch (error) {
        console.error('加载药品失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    async submitOrder() {
      if (!this.drug) {
        uni.showToast({ title: '药品信息加载中', icon: 'none' });
        return;
      }

      if (this.drug.stock <= 0) {
        uni.showToast({ title: '库存不足', icon: 'none' });
        return;
      }

      if (this.quantity > this.drug.stock) {
        uni.showToast({ title: '库存不足', icon: 'none' });
        return;
      }

      if (!this.receiverName.trim()) {
        uni.showToast({ title: '请输入收货人', icon: 'none' });
        return;
      }
      if (!this.receiverPhone.trim()) {
        uni.showToast({ title: '请输入联系电话', icon: 'none' });
        return;
      }
      if (!this.receiverAddress.trim()) {
        uni.showToast({ title: '请输入收货地址', icon: 'none' });
        return;
      }
      if (!this.userInfo?.username) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/drug/order/create',
          method: 'POST',
          data: {
            drugId: this.drugId,
            quantity: this.quantity,
            receiverName: this.receiverName,
            receiverPhone: this.receiverPhone,
            receiverAddress: this.receiverAddress,
            studentId: this.userInfo.username
          }
        });

        if (res.code === 200) {
          uni.showToast({ title: '订单创建成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/student/payment?orderId=${res.data.orderId}`
            });
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '创建失败', icon: 'none' });
        }
      } catch (error) {
        console.error('创建订单失败:', error);
        uni.showToast({ title: '创建失败', icon: 'none' });
      }
    },

    goToDetail() {
      uni.navigateTo({
        url: `/pages/student/medicine-detail?id=${this.drugId}`
      });
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

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
  display: block;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.order-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.drug-item {
  display: flex;
  align-items: center;
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

.drug-price {
  font-size: 26rpx;
  color: #ff4757;
}

.drug-quantity {
  font-size: 28rpx;
  color: #999;
}

.stock-info {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.stock-label {
  font-size: 26rpx;
  color: #52c41a;
}

.stock-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
  padding: 16rpx;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 12rpx;
}

.warning-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.warning-text {
  font-size: 26rpx;
  color: #ff4d4f;
}

.summary-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.summary-row.total {
  border-top: 1rpx solid #f0f0f0;
  margin-top: 12rpx;
  padding-top: 24rpx;
}

.summary-label {
  font-size: 28rpx;
  color: #666;
}

.summary-value {
  font-size: 28rpx;
  color: #333;
}

.summary-row.total .summary-label {
  font-size: 30rpx;
  font-weight: bold;
}

.summary-row.total .summary-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4757;
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

.total-info {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.total-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 8rpx;
}

.total-amount {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff4757;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24rpx 60rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.submit-btn.disabled {
  background: #ccc;
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