<script setup lang="ts">
import { Grid, Operation } from '@element-plus/icons-vue'

const { updateViewFilterSortGroup, viewStyleConfig } = useMDCardInject()
const cardCount = ref(5)
function handleChange(value: number) {
  const style = { ...viewStyleConfig.value, cardCount: value }
  updateViewFilterSortGroup('style', style)
}
watch(
  viewStyleConfig,
  (newVal) => {
    if (newVal?.cardCount) {
      cardCount.value = newVal.cardCount
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="md-card-layout-setting">
    <!-- <div class="setting-title">选择布局</div> -->
    <!-- <div class="layout-types">
      <div class="layout-item active">
        <el-icon><Grid /></el-icon>
        <span>平铺</span>
      </div>
    </div> -->
    <div class="slider-label">每行卡片数</div>
    <el-slider v-model="cardCount" :min="1" :max="8" :step="1" show-stops @change="handleChange" />
  </div>
</template>

<style scoped lang="scss">
.md-card-layout-setting {
  .setting-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #606266;
  }

  .layout-types {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .layout-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #606266;

    &.active {
      color: var(--app-accent-color);
      border-color: var(--app-accent-color);
    }

    &.disabled {
      opacity: 0.5;
    }
  }

  .slider-label {
    margin-bottom: 8px;
    color: #606266;
    font-size: 12px;
  }
}
</style>
