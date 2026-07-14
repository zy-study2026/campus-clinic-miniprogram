<template>
  <view class="container safe-area-top">
    <view class="header-bar">
      <button class="add-btn" @click="showAddModal">
        <text>➕ 添加科室</text>
      </button>
    </view>

    <view class="department-list">
      <view
        v-for="item in departments"
        :key="item.id"
        class="department-card"
      >
        <view class="card-content">
          <view class="department-name">{{ item.name }}</view>
          <view class="department-desc">{{ item.description || '暂无描述' }}</view>
        </view>
        <view class="card-actions">
          <button class="action-btn edit" @click="editDepartment(item)">编辑</button>
          <button class="action-btn delete" @click="deleteDepartment(item)">删除</button>
        </view>
      </view>

      <view class="empty-state" v-if="departments.length === 0">
        <text class="empty-icon">🏥</text>
        <text class="empty-text">暂无科室数据</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑科室' : '新增科室' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">科室名称 *</text>
            <input class="form-input" v-model="formData.name" placeholder="请输入科室名称" />
          </view>
          <view class="form-item">
            <text class="form-label">科室描述</text>
            <textarea class="form-textarea" v-model="formData.description" placeholder="请输入科室描述" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeModal">取消</button>
          <button class="modal-btn confirm" @tap="submitForm">确定</button>
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
      departments: [],
      showModal: false,
      isEdit: false,
      formData: {
        id: '',
        name: '',
        description: ''
      }
    };
  },
  onShow() {
    this.loadDepartments();
  },
  methods: {
    async loadDepartments() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/departments',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.departments = res.data || [];
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载科室列表失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    showAddModal() {
      this.isEdit = false;
      this.formData = { id: '', name: '', description: '' };
      this.showModal = true;
    },

    editDepartment(item) {
      this.isEdit = true;
      this.formData = {
        id: item.id,
        name: item.name,
        description: item.description || ''
      };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    async submitForm() {
      if (!this.formData.name.trim()) {
        uni.showToast({ title: '请输入科室名称', icon: 'none' });
        return;
      }

      const userInfo = uni.getStorageSync('userInfo');
      const url = this.isEdit
        ? 'http://localhost:3000/api/admin/department/update'
        : 'http://localhost:3000/api/admin/department/add';
      const method = this.isEdit ? 'PUT' : 'POST';

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
          this.loadDepartments();
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    deleteDepartment(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除科室 "${item.name}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/department/delete',
                method: 'DELETE',
                data: { id: item.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadDepartments();
              } else {
                uni.showToast({ title: result.msg || '删除失败', icon: 'none' });
              }
            } catch (error) {
              uni.showToast({ title: '网络错误', icon: 'none' });
            }
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
  box-sizing: border-box;
}

.header-bar {
  margin-bottom: 20rpx;
}

.add-btn {
  width: 100%;
  padding: 24rpx;
  background: #4facfe;
  border-radius: 12rpx;
  color: #fff;
  font-size: 32rpx;
  text-align: center;
}

.department-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.department-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  flex: 1;
}

.department-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.department-desc {
  font-size: 26rpx;
  color: #999;
}

.card-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  border: none;
}

.action-btn.edit {
  background: #fff;
  border: 1rpx solid #ddd;
  color: #666;
}

.action-btn.delete {
  background: #f44336;
  color: #fff;
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
  margin-bottom: 24rpx;
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
  width: 600rpx;
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
}

.modal-close {
  font-size: 40rpx;
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
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  border: none;
  border-radius: 0;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #43e97b;
  color: #fff;
}
</style>
