<template>
  <view class="container safe-area-top">
    <view class="add-btn" @tap="showAddModal">
      <text>➕ 发布公告</text>
    </view>
    
    <view class="list-container">
      <view class="list-item" v-for="item in announcements" :key="item.id">
        <view class="item-content">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-content-text">{{ item.content }}</text>
          <text class="item-time">{{ formatTime(item.publish_time) }}</text>
        </view>
        <view class="item-actions">
          <button class="action-btn edit" @tap="editAnnouncement(item)">编辑</button>
          <button class="action-btn delete" @tap="deleteAnnouncement(item)">删除</button>
        </view>
      </view>
      
      <view class="empty-state" v-if="announcements.length === 0">
        <text class="empty-icon">📢</text>
        <text class="empty-text">暂无公告</text>
      </view>
    </view>
    
    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑公告' : '发布公告' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">标题 *</text>
            <input class="form-input" v-model="formData.title" placeholder="请输入公告标题" />
          </view>
          <view class="form-item">
            <text class="form-label">内容 *</text>
            <textarea class="form-textarea" v-model="formData.content" placeholder="请输入公告内容" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeModal">取消</button>
          <button class="modal-btn confirm" @tap="submitForm">{{ isEdit ? '保存' : '发布' }}</button>
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
      isEdit: false,
      formData: {
        id: '',
        title: '',
        content: ''
      }
    };
  },
  onShow() {
    this.loadAnnouncements();
  },
  methods: {
    async loadAnnouncements() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/announcements',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          this.announcements = res.data || [];
        }
      } catch (error) {
        console.error('加载公告失败:', error);
      }
    },
    
    showAddModal() {
      this.isEdit = false;
      this.formData = { id: '', title: '', content: '' };
      this.showModal = true;
    },
    
    editAnnouncement(item) {
      this.isEdit = true;
      this.formData = {
        id: item.id,
        title: item.title,
        content: item.content
      };
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
    },
    
    async submitForm() {
      if (!this.formData.title.trim()) {
        uni.showToast({ title: '请输入公告标题', icon: 'none' });
        return;
      }
      if (!this.formData.content.trim()) {
        uni.showToast({ title: '请输入公告内容', icon: 'none' });
        return;
      }
      
      const userInfo = uni.getStorageSync('userInfo');
      let url = 'http://localhost:3000/api/admin/announcement/add';
      let method = 'POST';
      
      if (this.isEdit) {
        url = 'http://localhost:3000/api/admin/announcement/update';
        method = 'PUT';
      }
      
      try {
        const res = await uniRequest({
          url,
          method,
          data: this.formData,
          header: { 'x-role': userInfo?.roleValue }
        });
        
        if (res.code === 200) {
          uni.showToast({ title: res.msg, icon: 'success' });
          this.closeModal();
          this.loadAnnouncements();
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    
    deleteAnnouncement(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除公告 "${item.title}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/announcement/delete',
                method: 'DELETE',
                data: { id: item.id },
                header: { 'x-role': userInfo?.roleValue }
              });
              
              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadAnnouncements();
              } else {
                uni.showToast({ title: result.msg, icon: 'none' });
              }
            } catch (error) {
              console.error('删除失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

.add-btn {
  background: #667eea;
  color: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}

.list-container {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.list-item {
  padding: 24rpx;
  border-bottom: 1rpx solid #eee;
}

.list-item:last-child {
  border-bottom: none;
}

.item-content {
  margin-bottom: 16rpx;
}

.item-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.item-content-text {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
}

.action-btn.edit {
  background: #f0f0f0;
  color: #666;
}

.action-btn.delete {
  background: #ff4757;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 100rpx;
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
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 36rpx;
  color: #999;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 240rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #eee;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  border: none;
}

.modal-btn.cancel {
  background: #f0f0f0;
  color: #666;
}

.modal-btn.confirm {
  background: #667eea;
  color: #fff;
}
</style>