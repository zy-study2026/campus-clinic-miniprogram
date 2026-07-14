<template>
  <view class="container safe-area-top">
    <view class="search-bar">
      <input
        v-model="searchText"
        class="search-input"
        placeholder="搜索学号或姓名..."
      />
      <button class="search-btn" @click="searchStudents">
        <text>搜索</text>
      </button>
      <button class="add-btn" @click="showAddModal">
        <text>新增</text>
      </button>
    </view>

    <view class="student-list">
      <view
        v-for="student in filteredStudents"
        :key="student.id"
        class="student-card"
      >
        <view class="card-header">
          <text class="student-name">{{ student.name }}</text>
          <text class="student-username">{{ student.username }}</text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">性别：</text>
            <text class="value">{{ getGenderText(student.gender) }}</text>
          </view>
          <view class="info-row">
            <text class="label">出生日期：</text>
            <text class="value">{{ formatDate(student.birth_date) }}</text>
          </view>
          <view class="info-row">
            <text class="label">手机号：</text>
            <text class="value">{{ student.phone || '未绑定' }}</text>
          </view>
          <view class="info-row">
            <text class="label">注册时间：</text>
            <text class="value">{{ formatTime(student.create_time) }}</text>
          </view>
        </view>
        <view class="card-footer">
          <button class="action-btn edit" @click="editStudent(student)">编辑</button>
          <button class="action-btn reset" @click="resetPassword(student)">重置密码</button>
          <button class="action-btn delete" @click="deleteStudent(student)">删除</button>
        </view>
      </view>

      <view class="empty-state" v-if="filteredStudents.length === 0">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无学生数据</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑学生' : '新增学生' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item" v-if="!isEdit">
            <text class="form-label">学号 *</text>
            <input class="form-input" v-model="formData.username" placeholder="请输入学号" />
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
      students: [],
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
    filteredStudents() {
      if (!this.searchText) return this.students;
      const keyword = this.searchText.toLowerCase();
      return this.students.filter(s =>
        (s.username && s.username.toLowerCase().includes(keyword)) ||
        (s.name && s.name.toLowerCase().includes(keyword))
      );
    }
  },
  onShow() {
    this.loadStudents();
  },
  methods: {
    getGenderText(gender) {
      return gender === 1 ? '女' : '男';
    },

    async loadStudents() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/students',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.students = res.data || [];
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载学生列表失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    searchStudents() {
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

    editStudent(student) {
      this.isEdit = true;
      this.formData = {
        id: student.id,
        username: student.username,
        name: student.name,
        gender: student.gender || 0,
        birth_date: this.formatDate(student.birth_date, true),
        phone: student.phone || ''
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
        uni.showToast({ title: '请输入学号', icon: 'none' });
        return;
      }

      const userInfo = uni.getStorageSync('userInfo');
      const url = this.isEdit
        ? 'http://localhost:3000/api/admin/student/update'
        : 'http://localhost:3000/api/admin/student/add';
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
          this.loadStudents();
        } else {
          uni.showToast({ title: res.msg, icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    resetPassword(student) {
      uni.showModal({
        title: '确认重置密码',
        content: `确定将 "${student.name}" 的密码重置为默认密码 123456 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/student/resetPassword',
                method: 'POST',
                data: { id: student.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '密码重置成功', icon: 'success' });
              } else {
                uni.showToast({ title: result.msg || '操作失败', icon: 'none' });
              }
            } catch (error) {
              console.error('重置密码失败:', error);
              uni.showToast({ title: '操作失败', icon: 'none' });
            }
          }
        }
      });
    },

    deleteStudent(student) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除学生 "${student.name}" 吗？此操作不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/student/delete',
                method: 'DELETE',
                data: { id: student.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadStudents();
              } else {
                uni.showToast({ title: result.msg || '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
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

.add-btn {
  height: 80rpx;
  width: 120rpx;
  background: #52c41a;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.student-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.student-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.student-username {
  font-size: 24rpx;
  color: #999;
}

.card-body {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #999;
  width: 160rpx;
  flex-shrink: 0;
}

.value {
  font-size: 26rpx;
  color: #333;
}

.card-footer {
  display: flex;
  gap: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 16rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  background: #667eea;
  color: #fff;
}

.action-btn.reset {
  background: #faad14;
  color: #fff;
}

.action-btn.delete {
  background: #ff4d4f;
  color: #fff;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 30rpx;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.gender-picker {
  display: flex;
  gap: 16rpx;
}

.gender-option {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.gender-option.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-color: #667eea;
}

.picker-value {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #667eea;
  color: #fff;
}
</style>