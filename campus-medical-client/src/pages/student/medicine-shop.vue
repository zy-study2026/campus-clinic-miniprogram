<template>
  <view class="container">
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索药品名称"
          @confirm="loadDrugs"
        />
        <view class="search-btn" @click="loadDrugs">
          <text class="search-btn-text">搜索</text>
        </view>
      </view>
    </view>

    <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
      <view class="category-list">
        <view
          v-for="item in categories"
          :key="item.id"
          :class="['category-item', { active: selectedCategory === item.id }]"
          @click="selectCategory(item.id)"
        >
          {{ item.name }}
        </view>
      </view>
    </scroll-view>

    <view class="drug-list" v-if="drugs.length > 0">
      <view
        v-for="drug in drugs"
        :key="drug.id"
        :class="['drug-card', { 'out-of-stock': drug.stock <= 0 }]"
        @click="goToDetail(drug.id)"
      >
        <view class="drug-image">
          <text class="image-placeholder">💊</text>
          <view class="out-of-stock-tag" v-if="drug.stock <= 0">缺货</view>
        </view>
        <view class="drug-info">
          <text class="drug-name">{{ drug.name }}</text>
          <text class="drug-category">{{ drug.category_name }}</text>
          <text class="drug-indication">{{ drug.indication }}</text>
          <view class="drug-footer">
            <text class="drug-price">¥{{ drug.price }}</text>
            <text :class="['drug-stock', { 'stock-low': drug.stock > 0 && drug.stock < 10, 'stock-zero': drug.stock <= 0 }]">
              {{ drug.stock > 0 ? `剩余 ${drug.stock} 件` : '库存不足' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无药品</text>
    </view>
  </view>
</template>

<script>
import { uniRequest } from '@/utils/request';

export default {
  data() {
    return {
      keyword: '',
      categories: [],
      selectedCategory: 0,
      drugs: [],
      page: 1,
      pageSize: 10
    };
  },
  onLoad() {
    this.loadCategories();
    this.loadDrugs();
  },
  methods: {
    async loadCategories() {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/drug/categories',
          method: 'GET'
        });
        if (res.code === 200) {
          this.categories = [{ id: 0, name: '全部' }, ...res.data];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    },

    async loadDrugs() {
      try {
        const res = await uniRequest({
          url: 'http://localhost:3000/api/drug/list',
          method: 'GET',
          data: {
            categoryId: this.selectedCategory,
            keyword: this.keyword,
            page: this.page,
            pageSize: this.pageSize
          }
        });
        if (res.code === 200) {
          this.drugs = res.data.list;
        }
      } catch (error) {
        console.error('加载药品失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
      this.page = 1;
      this.loadDrugs();
    },

    goToDetail(drugId) {
      uni.navigateTo({
        url: `/pages/student/medicine-detail?id=${drugId}`
      });
    }
  }
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  padding: 20rpx 30rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12rpx 28rpx;
  border-radius: 24rpx;
  margin-left: 16rpx;
}

.search-btn-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: bold;
}

.category-scroll {
  background: #fff;
  white-space: nowrap;
  padding: 20rpx 0;
}

.category-list {
  display: inline-flex;
  padding: 0 20rpx;
}

.category-item {
  padding: 16rpx 32rpx;
  margin: 0 10rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.drug-list {
  padding: 20rpx;
}

.drug-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.drug-card.out-of-stock {
  opacity: 0.7;
}

.drug-image {
  width: 160rpx;
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  position: relative;
}

.image-placeholder {
  font-size: 60rpx;
}

.out-of-stock-tag {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.drug-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drug-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.drug-category {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  width: fit-content;
  margin-bottom: 12rpx;
}

.drug-indication {
  font-size: 24rpx;
  color: #999;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.drug-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.drug-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4757;
}

.drug-stock {
  font-size: 24rpx;
  color: #52c41a;
}

.drug-stock.stock-low {
  color: #faad14;
}

.drug-stock.stock-zero {
  color: #ff4d4f;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
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