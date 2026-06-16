<template>
  <div class="db-widget-error-state">
    <el-empty :description="description || 'Failed to load data'">
      <template #image>
        <Icon name="lucide:circle-alert" size="48" color="var(--el-color-danger)" />
      </template>
      <template v-if="showRetry" #default>
        <el-button type="primary" size="small" @click="$emit('retry')">
          Retry
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string
  showRetry?: boolean
}>()

defineEmits(['retry'])
</script>

<style scoped lang="scss">
.db-widget-error-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}
</style>
