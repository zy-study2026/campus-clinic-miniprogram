<template>
  <view class="container safe-area-top">
    <view class="search-bar">
      <input
        v-model="searchText"
        class="search-input"
        placeholder="搜索工号或姓名..."
      />
      <button class="search-btn" @click="searchDoctors">
        <text>搜索</text>
      </button>
      <button class="add-btn" @click="showAddModal">
        <text>新增</text>
      </button>
    </view>

    <view class="doctor-list">
      <view
        v-for="doctor in filteredDoctors"
        :key="doctor.id"
        class="doctor-card"
      >
        <view class="card-header">
          <text class="doctor-name">{{ doctor.name }}</text>
          <text class="doctor-username">{{ doctor.username }}</text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">性别：</text>
            <text class="value">{{ getGenderText(doctor.gender) }}</text>
          </view>
          <view class="info-row">
            <text class="label">出生日期：</text>
            <text class="value">{{ formatDate(doctor.birth_date) }}</text>
          </view>
          <view class="info-row">
            <text class="label">手机号：</text>
            <text class="value">{{ doctor.phone || '未绑定' }}</text>
          </view>
          <view class="info-row">
            <text class="label">注册时间：</text>
            <text class="value">{{ formatTime(doctor.create_time) }}</text>
          </view>
        </view>
        <view class="card-footer">
          <button class="action-btn edit" @click="editDoctor(doctor)">编辑</button>
          <button class="action-btn reset" @click="resetPassword(doctor)">重置密码</button>
          <button class="action-btn delete" @click="deleteDoctor(doctor)">删除</button>
        </view>
      </view>

      <view class="empty-state" v-if="filteredDoctors.length === 0">
        <text class="empty-icon">👨‍⚕️</text>
        <text class="empty-text">暂无医生数据</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑医生' : '新增医生' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item" v-if="!isEdit">
            <text class="form-label">工号 *</text>
            <input class="form-input" v-model="formData.username" placeholder="请输入工号" />
          </view>
          <view class="form-item">
            <text class="form-label">姓名 *</text>
            <input class="form-input" v-model="formData.name" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">性别</text>
            <view class="gender-picker">
              <view
                class="gender-option"
                :class="{ active: formData.gender === 0 }"
                @tap="formData.gender = 0"
              >
                <text>男</text>
              </view>
              <view
                class="gender-option"
                :class="{ active: formData.gender === 1 }"
                @tap="formData.gender = 1"
              >
                <text>女</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">出生日期</text>
            <picker mode="date" :value="formData.birth_date" @change="onBirthDateChange">
              <view class="picker-value">
                {{ formData.birth_date || '请选择日期' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="formData.phone" placeholder="请输入手机号" type="number" />
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
      doctors: [],
      searchText: '',
      showModal: false,
      isEdit: false,
      formData: {
        id: '',
        username: '',
        name: '',
        gender: 0,
        birth_date: '',
        phone: ''
      }
    };
  },
  computed: {
    filteredDoctors() {
      if (!this.searchText) return this.doctors;
      const keyword = this.searchText.toLowerCase();
      return this.doctors.filter(d =>
        (d.username && d.username.toLowerCase().includes(keyword)) ||
        (d.name && d.name.toLowerCase().includes(keyword))
      );
    }
  },
  onShow() {
    this.loadDoctors();
  },
  methods: {
    getGenderText(gender) {
      return gender === 1 ? '女' : '男';
    },

    async loadDoctors() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/doctors',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.doctors = res.data || [];
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载医生列表失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    searchDoctors() {
      // 搜索由computed属性自动处理
    },

    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    formatDate(dateStr, returnEmpty = false) {
      if (!dateStr) return returnEmpty ? '' : '未填写';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return returnEmpty ? '' : '未填写';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    showAddModal() {
      this.isEdit = false;
      this.formData = { id: '', username: '', name: '', gender: 0, birth_date: '', phone: '' };
      this.showModal = true;
    },

    editDoctor(doctor) {
      this.isEdit = true;
      this.formData = {
        id: doctor.id,
        username: doctor.username,
        name: doctor.name,
        gender: doctor.gender || 0,
        birth_date: this.formatDate(doctor.birth_date, true),
        phone: doctor.phone || ''
      };
      this.showModal = true;
    },

    onBirthDateChange(e) {
      this.formData.birth_date = e.detail.value;
    },

    closeModal() {
      this.showModal = false;
    },

    async submitForm() {
      if (!this.formData.name.trim()) {
        uni.showToast({ title: '请输入姓名', icon: 'none' });
        return;
      }

      if (!this.isEdit && !this.formData.username.trim()) {
        uni.showToast({ title: '请输入工号', icon: 'none' });
        return;
      }

      const userInfo = uni.getStorageSync('userInfo');
      const url = this.isEdit
        ? 'http://localhost:3000/api/admin/doctor/update'
        : 'http://localhost:3000/api/admin/doctor/add';
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
          this.loadDoctors();
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    resetPassword(doctor) {
      uni.showModal({
        title: '确认操作',
        content: `确定要重置 ${doctor.name} 的密码吗？重置后密码为123456`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/doctor/resetPassword',
                method: 'POST',
                data: { id: doctor.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '密码已重置为123456', icon: 'success' });
              } else {
                uni.showToast({ title: result.msg || '重置失败', icon: 'none' });
              }
            } catch (error) {
              uni.showToast({ title: '网络错误', icon: 'none' });
            }
          }
        }
      });
    },

    deleteDoctor(doctor) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除医生 "${doctor.name}" 吗？此操作不可恢复！`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/doctor/delete',
                method: 'DELETE',
                data: { id: doctor.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadDoctors();
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

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.search-btn {
  padding: 0 32rpx;
  background: #43e97b;
  border-radius: 12rpx;
  border: none;
  color: #fff;
  font-size: 28rpx;
  line-height: 80rpx;
}

.add-btn {
  padding: 0 32rpx;
  background: #4facfe;
  border-radius: 12rpx;
  color: #fff;
  font-size: 28rpx;
  line-height: 80rpx;
}

.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.doctor-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.doctor-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 16rpx;
}

.doctor-username {
  font-size: 24rpx;
  color: #999;
}

.card-body {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  font-size: 28rpx;
  margin-bottom: 8rpx;
}

.label {
  color: #666;
  width: 140rpx;
}

.value {
  color: #333;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
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

.action-btn.reset {
  background: #ff9800;
  color: #fff;
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

.gender-picker {
  display: flex;
  gap: 16rpx;
}

.gender-option {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.gender-option.active {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
  border-color: #43e97b;
}

.picker-value {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
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