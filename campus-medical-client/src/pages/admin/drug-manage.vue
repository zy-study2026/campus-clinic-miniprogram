<template>
  <view class="container safe-area-top">
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索药品名称"
        v-model="keyword"
        @confirm="loadDrugs"
      />
      <button class="search-btn" @tap="loadDrugs">搜索</button>
    </view>

    <view class="filter-row">
      <picker :value="categoryIndex" :range="categories" range-key="name" @change="onCategoryChange">
        <view class="category-picker">
          <text>{{ categoryIndex >= 0 ? categories[categoryIndex].name : '全部分类' }}</text>
        </view>
      </picker>
      <button class="category-btn" @tap="showCategoryModal">分类管理</button>
      <button class="add-btn" @tap="showAddModal">
        <text>➕ 添加</text>
      </button>
    </view>

    <view class="list-container">
      <view class="list-item" v-for="item in drugs" :key="item.id">
        <view class="item-content">
          <text class="item-name">{{ item.name }}</text>
          <view class="item-meta">
            <text class="meta-tag category">{{ item.category_name }}</text>
            <text class="meta-tag price">¥{{ item.price }}</text>
            <text class="meta-tag" :class="{ 'low-stock': item.stock < 10 }">库存: {{ item.stock }}</text>
          </view>
          <text class="item-desc" v-if="item.indication">{{ item.indication }}</text>
        </view>
        <view class="item-actions">
          <button class="action-btn edit" @tap="editDrug(item)">编辑</button>
          <button class="action-btn delete" @tap="deleteDrug(item)">删除</button>
        </view>
      </view>

      <view class="empty-state" v-if="drugs.length === 0">
        <text class="empty-icon">💊</text>
        <text class="empty-text">暂无药品</text>
      </view>
    </view>

    <view class="modal-overlay" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑药品' : '添加药品' }}</text>
          <text class="modal-close" @tap="closeModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">药品名称 *</text>
            <input class="form-input" v-model="formData.name" placeholder="请输入药品名称" />
          </view>
          <view class="form-item">
            <text class="form-label">药品分类 *</text>
            <picker :value="categoryIndex" :range="categories" range-key="name" @change="onFormCategoryChange">
              <view class="picker-value">
                {{ categoryIndex >= 0 ? categories[categoryIndex].name : '请选择分类' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">库存 *</text>
            <input class="form-input" type="number" v-model="formData.stock" placeholder="请输入库存数量" />
          </view>
          <view class="form-item">
            <text class="form-label">价格 *</text>
            <input class="form-input" type="digit" v-model="formData.price" placeholder="请输入价格" />
          </view>
          <view class="form-item">
            <text class="form-label">适应症</text>
            <textarea class="form-textarea" v-model="formData.indication" placeholder="请输入适应症" />
          </view>
          <view class="form-item">
            <text class="form-label">用法用量</text>
            <textarea class="form-textarea" v-model="formData.usage" placeholder="请输入用法用量" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeModal">取消</button>
          <button class="modal-btn confirm" @tap="submitForm">{{ isEdit ? '保存' : '添加' }}</button>
        </view>
      </view>
    </view>

    <view class="modal-overlay" v-if="showCategoryModalFlag" @tap="closeCategoryModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">分类管理</text>
          <text class="modal-close" @tap="closeCategoryModal">✕</text>
        </view>
        <view class="modal-body">
          <view class="category-list">
            <view class="category-item" v-for="cat in categories" :key="cat.id">
              <text class="category-name">{{ cat.name }}</text>
              <view class="category-actions">
                <button class="action-btn-small edit" @tap="editCategory(cat)">编辑</button>
                <button class="action-btn-small delete" @tap="deleteCategory(cat)">删除</button>
              </view>
            </view>
          </view>
          <view class="add-category-form">
            <input class="form-input" v-model="categoryForm.name" placeholder="输入新分类名称" />
            <button class="add-category-btn" @tap="addCategory">{{ categoryEditId ? '保存' : '添加' }}</button>
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
      drugs: [],
      keyword: '',
      categories: [],
      categoryIndex: -1,
      showModal: false,
      isEdit: false,
      showCategoryModalFlag: false,
      categoryEditId: '',
      categoryForm: {
        name: ''
      },
      formData: {
        id: '',
        name: '',
        categoryId: '',
        stock: '',
        price: '',
        indication: '',
        usage: ''
      }
    };
  },
  onShow() {
    this.loadDrugs();
    this.loadCategories();
  },
  methods: {
    async loadDrugs() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/drugs',
          method: 'GET',
          data: {
            keyword: this.keyword,
            categoryId: this.categoryIndex >= 0 ? this.categories[this.categoryIndex].id : ''
          },
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.drugs = res.data || [];
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' });
        }
      } catch (error) {
        console.error('加载药品失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    async loadCategories() {
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uniRequest({
          url: 'http://localhost:3000/api/admin/drug/categories',
          method: 'GET',
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          this.categories = res.data || [];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    },

    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.loadDrugs();
    },

    onFormCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.formData.categoryId = this.categories[this.categoryIndex]?.id;
    },

    showAddModal() {
      this.isEdit = false;
      this.formData = { id: '', name: '', categoryId: '', stock: '', price: '', indication: '', usage: '' };
      this.categoryIndex = -1;
      this.showModal = true;
    },

    editDrug(item) {
      this.isEdit = true;
      this.formData = {
        id: item.id,
        name: item.name,
        categoryId: item.category_id,
        stock: item.stock,
        price: item.price,
        indication: item.indication || '',
        usage: item.usage || ''
      };
      this.categoryIndex = this.categories.findIndex(c => c.id === item.category_id);
      if (this.categoryIndex === -1) this.categoryIndex = 0;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    async submitForm() {
      if (!this.formData.name.trim()) {
        uni.showToast({ title: '请输入药品名称', icon: 'none' });
        return;
      }
      if (!this.formData.categoryId) {
        uni.showToast({ title: '请选择分类', icon: 'none' });
        return;
      }
      if (!this.formData.stock && this.formData.stock !== 0) {
        uni.showToast({ title: '请输入库存数量', icon: 'none' });
        return;
      }
      if (!this.formData.price) {
        uni.showToast({ title: '请输入价格', icon: 'none' });
        return;
      }

      try {
        const userInfo = uni.getStorageSync('userInfo');
        const url = this.isEdit ? 'http://localhost:3000/api/admin/drug/update' : 'http://localhost:3000/api/admin/drug/add';
        const method = this.isEdit ? 'PUT' : 'POST';

        const res = await uniRequest({
          url,
          method,
          data: this.formData,
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          uni.showToast({ title: res.msg, icon: 'success' });
          this.closeModal();
          this.loadDrugs();
        } else {
          uni.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    deleteDrug(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除药品 "${item.name}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/drug/delete',
                method: 'DELETE',
                data: { id: item.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadDrugs();
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
    },

    showCategoryModal() {
      this.showCategoryModalFlag = true;
      this.categoryForm = { name: '' };
      this.categoryEditId = '';
    },

    closeCategoryModal() {
      this.showCategoryModalFlag = false;
    },

    editCategory(cat) {
      this.categoryEditId = cat.id;
      this.categoryForm.name = cat.name;
    },

    async addCategory() {
      if (!this.categoryForm.name.trim()) {
        uni.showToast({ title: '请输入分类名称', icon: 'none' });
        return;
      }

      try {
        const userInfo = uni.getStorageSync('userInfo');
        const url = this.categoryEditId ? 'http://localhost:3000/api/admin/drug/category/update' : 'http://localhost:3000/api/admin/drug/category/add';
        const method = this.categoryEditId ? 'PUT' : 'POST';
        const data = this.categoryEditId ? { id: this.categoryEditId, name: this.categoryForm.name } : { name: this.categoryForm.name };

        const res = await uniRequest({
          url,
          method,
          data,
          header: { 'x-role': userInfo?.roleValue }
        });

        if (res.code === 200) {
          uni.showToast({ title: res.msg, icon: 'success' });
          this.categoryForm = { name: '' };
          this.categoryEditId = '';
          this.loadCategories();
        } else {
          uni.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },

    deleteCategory(cat) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除分类 "${cat.name}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync('userInfo');
              const result = await uniRequest({
                url: 'http://localhost:3000/api/admin/drug/category/delete',
                method: 'DELETE',
                data: { id: cat.id },
                header: { 'x-role': userInfo?.roleValue }
              });

              if (result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadCategories();
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

.filter-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.category-picker {
  flex: 1;
  height: 80rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.category-btn, .add-btn {
  height: 80rpx;
  padding: 0 24rpx;
  background: #667eea;
  color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
}

.add-btn {
  background: #52c41a;
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

.item-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.item-meta {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}

.meta-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  color: #666;
}

.meta-tag.category {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.meta-tag.price {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.meta-tag.low-stock {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.item-desc {
  font-size: 26rpx;
  color: #999;
  display: block;
}

.item-actions {
  display: flex;
  gap: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 16rpx;
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

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
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

.category-list {
  margin-bottom: 24rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.category-name {
  font-size: 28rpx;
  color: #333;
}

.category-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn-small {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  border: none;
}

.action-btn-small.edit {
  background: #667eea;
  color: #fff;
}

.action-btn-small.delete {
  background: #ff4d4f;
  color: #fff;
}

.add-category-form {
  display: flex;
  gap: 16rpx;
}

.add-category-form .form-input {
  flex: 1;
}

.add-category-btn {
  width: 140rpx;
  height: 80rpx;
  background: #667eea;
  color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>