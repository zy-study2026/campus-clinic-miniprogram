<template>
  <view class="container safe-area-top">
    <view class="filter-bar">
      <picker mode="date" :value="selectedDate" @change="onDateChange">
        <view class="date-picker">
          <text>{{ selectedDate || '选择日期' }}</text>
        </view>
      </picker>
      <button class="filter-btn" @tap="loadDuties">筛选</button>
      <button class="reset-btn" @tap="resetFilter">重置</button>
    </view>

    <view class="add-btn" @tap="showAddModal">
      <text>➕ 添加排班</text>
    </view>

    <view class="list-container">
      <view class="list-item" v-for="item in duties" :key="item.id">
        <view class="item-content">
          <view class="item-header">
            <text class="item-doctor">{{ item.doctor_name }}</text>
            <text class="item-department">{{ item.department_name }}</text>
          </view>
          <view class="item-info">
            <text class="info-item">📅 {{ formatDate(item.date) }}</text>
            <text class="info-item">⏰ {{ item.time_slot }}</text>
            <text class="info-item">👥 {{ item.booked_appointments }}/{{ item.max_appointments }}</text>
          </view>
        </view>
        <view class="item-actions">
          <button class="action-btn edit" @tap="editDuty(item)">编辑</button>
          <button class="action-btn delete" @tap="deleteDuty(item)">删除</button>
        </view>
      </view>

      <view class="empty-state" v-if="duties.length === 0">
        <text class="empty-icon">📅</text>
        <text class="empty-text">暂无排班</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑排班' : '添加排班' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">医生 *</text>
            <picker :value="doctorIndex" :range="doctors" range-key="name" @change="onDoctorChange">
              <view class="picker-value">
                {{ doctorIndex >= 0 ? doctors[doctorIndex].name : '请选择医生' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">科室 *</text>
            <picker :value="departmentIndex" :range="departments" range-key="name" @change="onDepartmentChange">
              <view class="picker-value">
                {{ departmentIndex >= 0 ? departments[departmentIndex].name : '请选择科室' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">日期 *</text>
            <picker mode="date" :value="formData.date" @change="onDatePickerChange">
              <view class="picker-value">
                {{ formData.date || '请选择日期' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">时间段 *</text>
            <picker :value="timeSlotIndex" :range="timeSlots" @change="onTimeSlotChange">
              <view class="picker-value">
                {{ timeSlotIndex >= 0 ? timeSlots[timeSlotIndex] : '请选择时间段' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">最大预约数 *</text>
            <input class="form-input" type="number" v-model="formData.max_appointments" placeholder="请输入最大预约数" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeModal">取消</button>
          <button class="modal-btn confirm" @tap="submitForm">{{ isEdit ? '保存' : '添加' }}</button>
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
      duties: [],
      selectedDate: '',
      showModal: false,
      isEdit: false,
      formData: {
        id: '',
        doctorId: '',
        departmentId: '',
        date: '',
        timeSlot: '',
        max_appointments: ''
      },
      doctors: [],
      doctorIndex: -1,
      departments: [],
      departmentIndex: -1,
      timeSlots: ['上午 8:00-12:00', '下午 14:00-18:00', '晚上 18:00-20:00'],
      timeSlotIndex: -1
    };
  },
  onShow() {
    this.loadDuties();
    this.loadDoctorsAndDepartments();
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      return dateStr;
    },

    async loadDuties() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/duties',
          method: 'GET',
          data: { date: this.selectedDate },
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.duties = res.data || [];
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载排班失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    async loadDoctorsAndDepartments() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const [doctorRes, deptRes] = await Promise.all([
          uniRequest({
            url: 'http://localhost:3000/api/admin/doctors',
            method: 'GET',
            header: { 'x-role': userInfo?.roleValue }
          }),
          uniRequest({
            url: 'http://localhost:3000/api/admin/departments',
            method: 'GET',
            header: { 'x-role': userInfo?.roleValue }
          })
        ]);

        if (doctorRes.code === 200) {
          this.doctors = doctorRes.data || [];
        }
        if (deptRes.code === 200) {
          this.departments = deptRes.data || [];
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    },

    onDateChange(e) {
      this.selectedDate = e.detail.value;
      this.loadDuties();
    },

    resetFilter() {
      this.selectedDate = '';
      this.loadDuties();
    },

    onDoctorChange(e) {
      this.doctorIndex = e.detail.value;
      this.formData.doctorId = this.doctors[this.doctorIndex]?.id;
    },

    onDepartmentChange(e) {
      this.departmentIndex = e.detail.value;
      this.formData.departmentId = this.departments[this.departmentIndex]?.id;
    },

    onDatePickerChange(e) {
      this.formData.date = e.detail.value;
    },

    onTimeSlotChange(e) {
      this.timeSlotIndex = e.detail.value;
      this.formData.timeSlot = this.timeSlots[this.timeSlotIndex];
    },

    showAddModal() {
      this.isEdit = false;
      this.formData = { id: '', doctorId: '', departmentId: '', date: '', timeSlot: '', max_appointments: '' };
      this.doctorIndex = -1;
      this.departmentIndex = -1;
      this.timeSlotIndex = -1;
      this.showModal = true;
    },

    editDuty(item) {
      this.isEdit = true;
      this.formData = {
        id: item.id,
        doctorId: item.doctor_id,
        departmentId: item.department_id,
        date: this.formatDate(item.date),
        timeSlot: item.time_slot,
        max_appointments: item.max_appointments
      };
      this.doctorIndex = this.doctors.findIndex(d => d.id === item.doctor_id);
      this.departmentIndex = this.departments.findIndex(dep => dep.id === item.department_id);
      this.timeSlotIndex = this.timeSlots.indexOf(item.time_slot);
      if (this.timeSlotIndex === -1) this.timeSlotIndex = 0;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    async submitForm() {
      if (!this.formData.doctorId) {
        uni.showToast({ title: '请选择医生', icon: 'none' });
        return;
      }
      if (!this.formData.departmentId) {
        uni.showToast({ title: '请选择科室', icon: 'none' });
        return;
      }
      if (!this.formData.date) {
        uni.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      if (!this.formData.timeSlot) {
        uni.showToast({ title: '请选择时间段', icon: 'none' });
        return;
      }
      if (!this.formData.max_appointments || this.formData.max_appointments <= 0) {
        uni.showToast({ title: '请输入最大预约数', icon: 'none' });
        return;
      }

      try {
        const userInfo = uni.getStorageSync('userInfo');
        const url = this.isEdit ? 'http://localhost:3000/api/admin/duty/update' : 'http://localhost:3000/api/admin/duty/add';
        const method = this.isEdit ? 'PUT' : 'POST';

        const submitData = this.isEdit ? {
          id: this.formData.id,
          departmentId: this.formData.departmentId,
          date: this.formData.date,
          timeSlot: this.formData.timeSlot,
          maxAppointments: this.formData.max_appointments
        } : {
          doctorId: this.formData.doctorId,
          departmentId: this.formData.departmentId,
          date: this.formData.date,
          timeSlot: this.formData.timeSlot,
          maxAppointments: this.formData.max_appointments
        };

        const res = await uniRequest({
          url,
          method,
          data: submitData,
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          uni.showToast({ title: res.msg, icon: 'success' });
          this.closeModal();
          this.loadDuties();
        } else {
          uni.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    deleteDuty(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定删除该排班吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/duty/delete',
                method: 'DELETE',
                data: { id: item.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadDuties();
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

.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.date-picker {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 40rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.filter-btn, .reset-btn {
  height: 80rpx;
  width: 120rpx;
  background: #667eea;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-btn {
  background: #999;
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
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.list-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.item-doctor {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.item-department {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.item-info {
  display: flex;
  gap: 24rpx;
  flex-wrap: wrap;
}

.info-item {
  font-size: 26rpx;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  border: none;
}

.action-btn.edit {
  background: #667eea;
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
  max-height: 80vh;
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