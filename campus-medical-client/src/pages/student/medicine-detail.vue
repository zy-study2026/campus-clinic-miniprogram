<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="header-title">药品详情</text>
      </view>
    </view>

    <view class="content" v-if="drug">
      <view class="drug-card">
        <view class="drug-image">
          <text class="image-placeholder">💊</text>
        </view>
        <view class="drug-basic">
          <text class="drug-name">{{ drug.name }}</text>
          <text class="drug-category">{{ drug.category_name }}</text>
          <text class="drug-price">¥{{ drug.price }}</text>
        </view>
      </view>

      <view class="info-section">
        <text class="section-title">功能主治</text>
        <text class="section-content">{{ drug.indication || '暂无信息' }}</text>
      </view>

      <view class="info-section">
        <text class="section-title">用法用量</text>
        <text class="section-content">{{ drug.usage || '暂无信息' }}</text>
      </view>

      <view class="info-section">
        <text class="section-title">库存</text>
        <text :class="['section-content', 'stock', { 'stock-zero': drug.stock <= 0 }]">
          {{ drug.stock > 0 ? `${drug.stock} 件` : '暂时缺货' }}
        </text>
      </view>
    </view>

    <view class="out-of-stock-notice" v-if="drug && drug.stock <= 0">
      <text class="notice-icon">⚠️</text>
      <text class="notice-text">该药品暂时缺货，请关注后续补货</text>
    </view>

    <view class="bottom-bar" v-if="drug">
      <view class="quantity-control" v-if="drug.stock > 0">
        <text class="qty-btn" @click="decreaseQty">−</text>
        <text class="qty-value">{{ quantity }}</text>
        <text class="qty-btn" @click="increaseQty">+</text>
      </view>
      <view class="quantity-control disabled" v-else>
        <text class="qty-btn">−</text>
        <text class="qty-value">0</text>
        <text class="qty-btn">+</text>
      </view>
      <view class="total-price">
        <text class="total-label">合计</text>
        <text class="total-value">¥{{ (drug.price * quantity).toFixed(2) }}</text>
      </view>
      <view
        :class="['buy-btn', { disabled: drug.stock <= 0 }]"
        @click="buyNow"
      >
        {{ drug.stock > 0 ? '立即购买' : '暂时缺货' }}
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
      quantity: 1,
      drugId: null
    };
  },
  onLoad(options) {
    this.drugId = options?.id;
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
          this.quantity = 1;
        }
      } catch (error) {
        console.error('加载药品详情失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    decreaseQty() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },

    increaseQty() {
      if (this.drug && this.quantity < this.drug.stock) {
        this.quantity++;
      }
    },

    buyNow() {
      if (!this.drug) {
        uni.showToast({ title: '药品信息加载中', icon: 'none' });
        return;
      }

      if (this.drug.stock <= 0) {
        uni.showToast({ title: '库存不足', icon: 'none' });
        return;
      }

      if (this.quantity <= 0) {
        uni.showToast({ title: '请选择购买数量', icon: 'none' });
        return;
      }

      if (this.quantity > this.drug.stock) {
        uni.showToast({ title: '库存不足', icon: 'none' });
        return;
      }

      uni.navigateTo({
        url: `/pages/student/order-confirm?id=${this.drugId}&quantity=${this.quantity}`
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

.drug-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.drug-image {
  width: 200rpx;
  height: 200rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
}

.image-placeholder {
  font-size: 80rpx;
}

.drug-basic {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.drug-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.drug-category {
  font-size: 26rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
  margin-bottom: 20rpx;
}

.drug-price {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff4757;
}

.info-section {
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
  margin-bottom: 16rpx;
  display: block;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.section-content.stock {
  color: #52c41a;
}

.section-content.stock-zero {
  color: #ff4d4f;
}

.out-of-stock-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 77, 79, 0.1);
  padding: 20rpx 30rpx;
  margin: 0 30rpx 20rpx;
  border-radius: 16rpx;
}

.notice-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.notice-text {
  font-size: 26rpx;
  color: #ff4d4f;
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

.quantity-control {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 30rpx;
  padding: 8rpx;
}

.quantity-control.disabled {
  opacity: 0.5;
}

.qty-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #666;
}

.quantity-control.disabled .qty-btn {
  color: #ccc;
}

.qty-value {
  width: 80rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.total-price {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  margin-right: 20rpx;
}

.total-label {
  font-size: 26rpx;
  color: #999;
  margin-right: 8rpx;
}

.total-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4757;
}

.buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 24rpx 48rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.buy-btn.disabled {
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