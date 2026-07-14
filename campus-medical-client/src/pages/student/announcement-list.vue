<template>
  <view class="container safe-area-top">
    <view class="announcement-list" v-if="announcements.length > 0">
      <view
        class="announcement-item"
        v-for="item in announcements"
        :key="item.id"
        @click="showDetail(item)"
      >
        <view class="item-content">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-time">{{ formatDate(item.create_time) }}</text>
        </view>
        <text class="item-arrow">›</text>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无公告</text>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentItem?.title }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <text class="modal-time">{{ formatDate(currentItem?.create_time) }}</text>
          <text class="modal-text">{{ currentItem?.content }}</text>
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
      announcements: [],
      showModal: false,
      currentItem: null
    };
  },
  onLoad() {
    this.loadAnnouncements();
  },
  methods: {
    async loadAnnouncements() {
      uni.showLoading({ title: '加载中...' });
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/announcement/list',
          method: 'GET'
        });
        if (res.code === 200) {
          this.announcements = res.data || [];
        }
      } catch (error) {
        console.error('获取公告列表失败:', error);
        this.announcements = [];
      } finally {
        uni.hideLoading();
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    showDetail(item) {
      this.currentItem = item;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.currentItem = null;
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.announcement-list {
  padding-top: 10rpx;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.item-content {
  flex: 1;
  padding-right: 20rpx;
}

.item-title {
  display: block;
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}

.item-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 650rpx;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  padding-right: 20rpx;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-time {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.modal-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}
</style>