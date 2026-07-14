<template>
  <view class="container safe-area-top">
    <view class="welcome">
      <text class="greeting">你好，{{ userInfo?.name }}</text>
      <text class="subtitle">欢迎使用校园医务室</text>
    </view>

    <view class="announcement-section" v-if="announcements.length > 0">
      <view class="section-header">
        <text class="section-title">📢 公告</text>
        <text class="more-btn" @click="goToAnnouncements">更多 ›</text>
      </view>
      <scroll-view class="announcement-scroll" scroll-x>
        <view class="announcement-cards">
          <view
            class="announcement-card"
            v-for="item in announcements"
            :key="item.id"
            @click="showAnnouncementDetail(item)"
          >
            <text class="card-title">{{ item.title }}</text>
            <text class="card-time">{{ formatDate(item.create_time) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="announcement-empty" v-else-if="!loading && announcements.length === 0">
      <text class="empty-text">暂无公告</text>
    </view>

    <view class="quick-actions">
      <view class="action-item" @click="goToAppoint">
        <view class="action-icon">📅</view>
        <text class="action-text">预约挂号</text>
      </view>
      <view class="action-item" @click="goToRecords">
        <view class="action-icon">📋</view>
        <text class="action-text">我的病历</text>
      </view>
      <view class="action-item" @click="goToMedicineShop">
        <view class="action-icon">💊</view>
        <text class="action-text">药品商城</text>
      </view>
      <view class="action-item" @click="goToOrders">
        <view class="action-icon">📦</view>
        <text class="action-text">我的订单</text>
      </view>
    </view>

    <view class="info-card">
      <text class="card-title">📌 就诊须知</text>
      <view class="card-content">
        <text>• 请提前预约挂号，按预约时间就诊</text>
        <text>• 就诊时请携带学生证</text>
        <text>• 药品请在有效期内使用</text>
        <text>• 如有紧急情况请直接前往医务室</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showDetail" @tap="closeDetail">
      <view class="detail-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentAnnouncement?.title }}</text>
          <text class="modal-close" @tap="closeDetail">✕</text>
        </view>
        <view class="modal-body">
          <text class="detail-time">{{ formatDate(currentAnnouncement?.create_time) }}</text>
          <text class="detail-content">{{ currentAnnouncement?.content }}</text>
        </view>
      </view>
    </view>

    <!-- AI悬浮球 -->
    <view class="ai-float-area">
      <movable-area class="movable-area">
        <movable-view 
          class="ai-float-btn" 
          :x="floatX" 
          :y="floatY" 
          direction="all"
          @click="showChatModal = true"
        >
          <text class="float-icon">🤖</text>
        </movable-view>
      </movable-area>
    </view>

    <!-- AI聊天窗口 -->
    <view class="chat-overlay" v-if="showChatModal" @tap="closeChatModal">
      <view class="chat-modal" @tap.stop>
        <view class="chat-header">
          <text class="chat-title">AI导诊助手</text>
          <text class="chat-close" @tap="closeChatModal">✕</text>
        </view>
        
        <scroll-view 
          class="chat-messages" 
          scroll-y 
          :scroll-top="scrollTop"
          :scroll-with-animation="true"
        >
          <view 
            v-for="(msg, index) in chatMessages" 
            :key="index"
            :class="['message-item', msg.type]"
          >
            <view class="message-bubble">
              <text class="message-content">{{ msg.content }}</text>
            </view>
          </view>
          <view v-if="isLoading" class="loading-item">
            <text class="loading-text">正在输入...</text>
          </view>
        </scroll-view>
        
        <view class="chat-disclaimer">
          <text class="disclaimer-text">AI建议仅供参考，不能替代专业诊断</text>
        </view>
        
        <view class="chat-input-area">
          <input 
            class="chat-input" 
            v-model="inputMessage" 
            placeholder="请描述您的症状..."
            @confirm="sendMessage"
          />
          <view 
            :class="['send-btn', { disabled: !inputMessage.trim() || isLoading || canSend === false }]"
            @click="sendMessage"
          >
            <text class="send-text">发送</text>
          </view>
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
      announcements: [],
      loading: false,
      showDetail: false,
      currentAnnouncement: null,
      
      // AI聊天相关
      showChatModal: false,
      chatMessages: [],
      inputMessage: '',
      isLoading: false,
      canSend: true,
      floatX: 500,
      floatY: 600,
      scrollTop: 0
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync('userInfo');
    this.loadAnnouncements();
    
    // 初始化欢迎消息
    if (this.chatMessages.length === 0) {
      this.chatMessages.push({
        type: 'ai',
        content: '您好！我是校园医务室的AI导诊助手。请问有什么可以帮助您的？'
      });
    }
  },
  methods: {
    async loadAnnouncements() {
      this.loading = true;
      uni.showLoading({ title: '加载中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/announcement/list',
          method: 'GET'
        });

        if (res.code === 200) {
          this.announcements = (res.data || []).slice(0, 5);
        } else {
          this.announcements = [];
        }
      } catch (error) {
        console.error('获取公告列表失败:', error);
        this.announcements = [];
      } finally {
        this.loading = false;
        uni.hideLoading();
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    showAnnouncementDetail(item) {
      this.currentAnnouncement = item;
      this.showDetail = true;
    },

    closeDetail() {
      this.showDetail = false;
      this.currentAnnouncement = null;
    },

    goToAppoint() {
      uni.navigateTo({ url: '/pages/student/appoint' });
    },
    goToRecords() {
      uni.switchTab({ url: '/pages/student/my-record' });
    },
    goToMedicineShop() {
      uni.navigateTo({ url: '/pages/student/medicine-shop' });
    },
    goToOrders() {
      uni.navigateTo({ url: '/pages/student/my-orders' });
    },
    goToAnnouncements() {
      uni.navigateTo({ url: '/pages/student/announcement-list' });
    },

    // AI聊天方法
    closeChatModal() {
      this.showChatModal = false;
    },

    async sendMessage() {
      const message = this.inputMessage.trim();
      
      if (!message || this.isLoading || !this.canSend) {
        return;
      }

      // 添加用户消息
      this.chatMessages.push({
        type: 'user',
        content: message
      });
      this.inputMessage = '';
      this.isLoading = true;
      this.canSend = false;
      
      // 滚动到底部
      setTimeout(() => {
        this.scrollTop = 99999;
      }, 100);

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/ai/chat',
          method: 'POST',
          data: { message }
        });

        if (res.code === 200 && res.data?.reply) {
          this.chatMessages.push({
            type: 'ai',
            content: res.data.reply
          });
        } else {
          this.chatMessages.push({
            type: 'ai',
            content: '抱歉，AI服务暂时不可用，请稍后重试。'
          });
        }
      } catch (error) {
        console.error('AI聊天失败:', error);
        this.chatMessages.push({
          type: 'ai',
          content: '网络错误，请检查网络连接后重试。'
        });
      } finally {
        this.isLoading = false;
        
        // 滚动到底部
        setTimeout(() => {
          this.scrollTop = 99999;
        }, 100);
        
        // 防抖：2秒后才能再次发送
        setTimeout(() => {
          this.canSend = true;
        }, 2000);
      }
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

.announcement-section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 26rpx;
  color: #667eea;
}

.announcement-scroll {
  white-space: nowrap;
}

.announcement-cards {
  display: flex;
  gap: 20rpx;
}

.announcement-card {
  min-width: 280rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.announcement-card .card-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-card .card-time {
  font-size: 22rpx;
  color: #999;
}

.announcement-empty {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.action-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.action-text {
  font-size: 28rpx;
  color: #333;
}

.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.card-content text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
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

.detail-modal {
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

.detail-time {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.detail-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

/* AI悬浮球样式 */
.ai-float-area {
  position: fixed;
  right: 30rpx;
  bottom: 200rpx;
  z-index: 1000;
}

.movable-area {
  width: 120rpx;
  height: 120rpx;
}

.ai-float-btn {
  width: 100rpx;
  height: 100rpx;
  background: #007aff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.4);
}

.float-icon {
  font-size: 48rpx;
}

/* AI聊天窗口样式 */
.chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1001;
}

.chat-modal {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.chat-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.chat-close {
  font-size: 40rpx;
  color: #999;
}

.chat-messages {
  flex: 1;
  padding: 20rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.message-item {
  display: flex;
  margin-bottom: 24rpx;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 20rpx 28rpx;
  border-radius: 24rpx;
}

.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx 8rpx 24rpx 24rpx;
}

.ai .message-bubble {
  background: #f5f5f5;
  border-radius: 8rpx 24rpx 24rpx 24rpx;
}

.message-content {
  font-size: 28rpx;
  line-height: 1.6;
}

.user .message-content {
  color: #fff;
}

.ai .message-content {
  color: #333;
}

.loading-item {
  display: flex;
  justify-content: flex-start;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
}

.chat-disclaimer {
  padding: 16rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.disclaimer-text {
  font-size: 22rpx;
  color: #999;
}

.chat-input-area {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fafafa;
  border-top: 1rpx solid #f0f0f0;
}

.chat-input {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx 40rpx;
  border-radius: 40rpx;
}

.send-btn.disabled {
  opacity: 0.5;
}

.send-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
</style>