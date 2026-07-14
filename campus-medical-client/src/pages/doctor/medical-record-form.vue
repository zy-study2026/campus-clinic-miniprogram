<template>
  <view class="container safe-area-top">
    <view class="patient-info">
      <text class="patient-title">📋 患者信息</text>
      <view class="patient-detail">
        <text class="detail-text">姓名：{{ studentName }}</text>
        <text class="detail-text">性别：{{ getGenderText(studentGender) }}</text>
        <text class="detail-text">年龄：{{ studentAge }}岁</text>
        <text class="detail-text">学号：{{ studentUsername }}</text>
        <text class="detail-text" v-if="appointmentDate">预约时间：{{ appointmentDate }}</text>
      </view>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="form-label">主诉 *</text>
        <textarea
          v-model="form.subjective"
          class="textarea"
          placeholder="请输入患者主诉（主要症状）"
          maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="form-label">现病史 *</text>
        <textarea
          v-model="form.present_illness"
          class="textarea"
          placeholder="请输入现病史（疾病发生发展情况）"
          maxlength="1000"
        />
      </view>

      <view class="form-item">
        <text class="form-label">既往史</text>
        <textarea
          v-model="form.past_history"
          class="textarea"
          placeholder="请输入既往病史（若无请填无）"
          maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="form-label">体格检查 *</text>
        <textarea
          v-model="form.examination"
          class="textarea"
          placeholder="请输入体格检查结果"
          maxlength="1000"
        />
      </view>

      <view class="form-item">
        <text class="form-label">诊断结果 *</text>
        <textarea
          v-model="form.diagnosis"
          class="textarea"
          placeholder="请输入诊断结果"
          maxlength="500"
        />
      </view>

      <view class="form-item">
        <text class="form-label">治疗建议 *</text>
        <textarea
          v-model="form.treatment"
          class="textarea"
          placeholder="请输入治疗建议"
          maxlength="1000"
        />
      </view>
    </view>

    <view class="submit-section">
      <button class="submit-btn" @tap="submitForm" :disabled="!canSubmit">
        <text>提交病历</text>
      </button>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      appointmentId: '',
      studentName: '',
      studentGender: null,
      studentBirthDate: '',
      studentUsername: '',
      appointmentDate: '',
      userInfo: null,
      form: {
        subjective: '',
        present_illness: '',
        past_history: '',
        examination: '',
        diagnosis: '',
        treatment: ''
      }
    };
  },
  onLoad(options) {
    this.appointmentId = options?.appointmentId || '';
    this.studentName = decodeURIComponent(options?.studentName || '');
    this.studentGender = options?.studentGender !== undefined ? parseInt(options.studentGender) : null;
    this.studentBirthDate = options?.studentBirthDate || '';
    this.studentUsername = decodeURIComponent(options?.studentUsername || '');
    this.appointmentDate = decodeURIComponent(options?.date || '');
    this.userInfo = uni.getStorageSync('userInfo');
  },
  computed: {
    studentAge() {
      if (!this.studentBirthDate) return 0;
      const birthDate = new Date(this.studentBirthDate);
      const now = new Date();
      let age = now.getFullYear() - birthDate.getFullYear();
      if (now.getMonth() < birthDate.getMonth() ||
          (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    },
    canSubmit() {
      return this.appointmentId &&
             this.form.subjective.trim() &&
             this.form.present_illness.trim() &&
             this.form.examination.trim() &&
             this.form.diagnosis.trim() &&
             this.form.treatment.trim();
    }
  },
  methods: {
    getGenderText(gender) {
      if (gender === undefined || gender === null) return '未知';
      return gender === 1 ? '女' : '男';
    },

    async submitForm() {
      if (!this.canSubmit) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '提交中...' });

      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/doctor/medicalRecord',
          method: 'POST',
          data: {
            appointmentId: this.appointmentId,
            doctorId: this.userInfo?.id,
            subjective: this.form.subjective,
            present_illness: this.form.present_illness,
            past_history: this.form.past_history,
            examination: this.form.examination,
            diagnosis: this.form.diagnosis,
            treatment: this.form.treatment
          }
        });

        uni.hideLoading();

        if (res.code === 200) {
          uni.showToast({ title: '病历提交成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ title: res.msg || '提交失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
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

.patient-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.patient-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
  display: block;
}

.patient-detail {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-text {
  font-size: 28rpx;
  color: #fff;
}

.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 16rpx;
  display: block;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.submit-section {
  padding-bottom: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 16rpx;
  border: none;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>
