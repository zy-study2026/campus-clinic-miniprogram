<template>
  <view class="container safe-area-top">
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索学生姓名"
        v-model="keyword"
        @confirm="loadOrders"
      />
      <button class="search-btn" @tap="loadOrders">搜索</button>
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
      <view class="list-item" v-for="item in orders" :key="item.id">
        <view class="item-content">
          <view class="item-header">
            <text class="item-id">订单号: {{ item.id }}</text>
            <text class="item-status" :class="getStatusClass(item.status)">{{ item.statusText }}</text>
          </view>
          <view class="item-info">
            <text class="info-item">👤 {{ item.student_name || '未知' }}</text>
            <text class="info-item">💊 {{ item.drug_name || '未知' }} x{{ item.quantity }}</text>
          </view>
          <view class="item-detail">
            <text class="detail-text">📍 {{ item.receiver_address || '无地址' }}</text>
            <text class="detail-text">📞 {{ item.receiver_phone || '无电话' }}</text>
          </view>
          <view class="item-footer">
            <text class="item-price">¥{{ item.total_price }}</text>
            <text class="item-time">{{ formatTime(item.order_time) }}</text>
          </view>
        </view>
        <view class="item-actions" v-if="item.status === 1 || item.status === 2">
          <button class="action-btn" @tap="updateStatus(item)">
            <text>{{ item.status === 1 ? '开始配送' : '确认完成' }}</text>
          </button>
        </view>
      </view>

      <view class="empty-state" v-if="orders.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
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
      keyword: '',
      selectedStatus: '',
      statusTabs: [
        { label: '全部', value: '' },
        { label: '待支付', value: 0 },
        { label: '已支付', value: 1 },
        { label: '配送中', value: 2 },
        { label: '已完成', value: 3 },
        { label: '已取消', value: 4 }
      ]
    };
  },
  onShow() {
    this.loadOrders();
  },
  methods: {
    async loadOrders() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/orders',
          method: 'GET',
          data: {
            status: this.selectedStatus
          },
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          let data = res.data || [];
          if (this.keyword) {
            data = data.filter(item =>
              (item.student_name && item.student_name.includes(this.keyword)) ||
              (item.student_username && item.student_username.includes(this.keyword))
            );
          }
          this.orders = data;
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载订单失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    onStatusChange(status) {
      this.selectedStatus = status;
      this.loadOrders();
    },

    getStatusClass(status) {
      const classMap = {
        0: 'status-pending',
        1: 'status-paid',
        2: 'status-delivering',
        3: 'status-completed',
        4: 'status-canceled'
      };
      return classMap[status] || '';
    },

    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    updateStatus(item) {
      const newStatus = item.status === 1 ? 2 : 3;
      const statusText = item.status === 1 ? '配送中' : '已完成';

      uni.showModal({
        title: '确认操作',
        content: `确定将订单状态改为"${statusText}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/order/updateStatus',
                method: 'PUT',
                data: { id: item.id, status: newStatus },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: result.msg || '更新成功', icon: 'success' });
                this.loadOrders();
              } else {
                uni.showToast({ title: result.msg || '操作失败', icon: 'none' });
              }
            } catch (error) {
              console.error('更新失败:', error);
              uni.showToast({ title: '操作失败', icon: 'none' });
            }
          }
        }
      });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.search-btn {
  height: 80rpx;
  width: 120rpx;
  background: #667eea;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.filter-tabs {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 20rpx;
  overflow-x: auto;
}

.tab-item {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.tab-item.active {
  background: #667eea;
  color: #fff;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.list-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.item-content {
  margin-bottom: 16rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-id {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.item-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.status-pending {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.status-paid {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.status-delivering {
  background: rgba(0, 150, 136, 0.1);
  color: #009688;
}

.status-completed {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.status-canceled {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.item-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 12rpx;
}

.info-item {
  font-size: 28rpx;
  color: #666;
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.detail-text {
  font-size: 26rpx;
  color: #999;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}

.item-actions {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 16rpx;
}

.action-btn {
  width: 100%;
  height: 72rpx;
  background: #667eea;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
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