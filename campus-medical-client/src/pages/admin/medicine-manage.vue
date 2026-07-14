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
    
    <view v-if="activeTab === 'drugs'" class="drug-list">
      <view 
        v-for="drug in drugs" 
        :key="drug.id"
        class="drug-card"
      >
        <view class="card-header">
          <text class="drug-icon">💊</text>
          <view class="drug-info">
            <text class="drug-name">{{ drug.name }}</text>
            <text class="drug-category">{{ drug.category_name }}</text>
          </view>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">价格：</text>
            <text class="value price">¥{{ drug.price.toFixed(2) }}</text>
          </view>
          <view class="info-row">
            <text class="label">库存：</text>
            <text class="value" :class="{ low: drug.stock < 10 }">{{ drug.stock }}盒</text>
          </view>
          <view class="info-row">
            <text class="label">规格：</text>
            <text class="value">{{ drug.specification }}</text>
          </view>
          <view v-if="drug.indication" class="info-row">
            <text class="label">适应症：</text>
            <text class="value">{{ drug.indication }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="activeTab === 'orders'" class="order-list">
      <view 
        v-for="order in orders" 
        :key="order.id"
        class="order-card"
      >
        <view class="card-header">
          <text class="order-id">订单号：{{ order.id }}</text>
          <text class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</text>
        </view>
        <view class="card-body">
          <view class="drug-info">
            <text class="drug-icon">💊</text>
            <view class="drug-detail">
              <text class="drug-name">{{ order.drug_name }}</text>
              <text class="drug-qty">数量：{{ order.quantity }}盒</text>
            </view>
            <text class="drug-price">¥{{ order.total_price.toFixed(2) }}</text>
          </view>
          <view class="student-info">
            <text class="info-title">领取人信息</text>
            <view class="info-row">
              <text class="label">姓名：</text>
              <text class="value">{{ order.receiver_name }}</text>
            </view>
            <view class="info-row">
              <text class="label">电话：</text>
              <text class="value">{{ order.receiver_phone }}</text>
            </view>
          </view>
        </view>
        <view class="card-footer">
          <text class="order-time">{{ formatTime(order.order_time) }}</text>
        </view>
      </view>
    </view>
    
    <view v-if="(activeTab === 'drugs' && drugs.length === 0) || (activeTab === 'orders' && orders.length === 0)" class="empty-state">
      <text class="empty-icon">📦</text>
      <text class="empty-text">{{ activeTab === 'drugs' ? '暂无药品' : '暂无订单' }}</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      tabs: [
        { value: 'drugs', label: '药品管理' },
        { value: 'orders', label: '订单管理' }
      ],
      activeTab: 'drugs',
      drugs: [],
      orders: []
    };
  },
  onShow() {
    if (this.activeTab === 'drugs') {
      this.loadDrugs();
    } else {
      this.loadOrders();
    }
  },
  watch: {
    activeTab(val) {
      if (val === 'drugs') {
        this.loadDrugs();
      } else {
        this.loadOrders();
      }
    }
  },
  methods: {
    async loadDrugs() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/drugs',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          this.drugs = res.data;
        }
      } catch (error) {
        console.error('加载药品失败:', error);
      }
    },
    
    async loadOrders() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/drug-orders',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          this.orders = res.data;
        }
      } catch (error) {
        console.error('加载订单失败:', error);
      }
    },
    
    getStatusClass(status) {
      switch (status) {
        case 0: return 'status-pending';
        case 1: return 'status-paid';
        case 2: return 'status-delivery';
        case 3: return 'status-completed';
        case 4: return 'status-cancelled';
        default: return '';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 0: return '待支付';
        case 1: return '待发货';
        case 2: return '配送中';
        case 3: return '已完成';
        case 4: return '已取消';
        default: return '未知';
      }
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

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
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
  color: #43e97b;
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
  background: #43e97b;
  border-radius: 2rpx;
}

.drug-list {
  padding: 20rpx 30rpx;
}

.drug-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.drug-icon {
  font-size: 56rpx;
  margin-right: 20rpx;
}

.drug-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drug-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.drug-category {
  font-size: 26rpx;
  color: #999;
}

.card-body {
  padding: 16rpx 0;
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
}

.value.price {
  color: #ff6b6b;
  font-weight: bold;
}

.value.low {
  color: #ff6b6b;
}

.order-list {
  padding: 20rpx 30rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-id {
  font-size: 26rpx;
  color: #999;
}

.order-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-paid {
  background: #cce5ff;
  color: #004085;
}

.status-delivery {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.drug-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.drug-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drug-qty {
  font-size: 24rpx;
  color: #999;
}

.student-info {
  padding-left: 64rpx;
}

.info-title {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #666;
  margin-bottom: 12rpx;
}

.card-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
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
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
