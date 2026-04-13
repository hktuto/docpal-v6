<script setup lang="ts">
const props = defineProps<{
  menuItem: any
}>()
</script>

<template>
  <div class="view-permissions-settings">
    <div class="section-header">
      <h2>Permissions</h2>
      <p>Configure who can access this view.</p>
    </div>

    <el-alert
      title="Coming Soon"
      type="info"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>View-level permissions are coming in a future update.</p>
        <p>Currently, view permissions inherit from the parent workspace permissions.</p>
      </template>
    </el-alert>
  </div>
</template>

<style lang="scss" scoped>
.view-permissions-settings {
  max-width: 600px;
}

.section-header {
  margin-bottom: var(--app-space-l);
  
  h2 {
    margin: 0 0 var(--app-space-xs);
    font-size: var(--app-font-size-xl);
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
}

.el-alert {
  p {
    margin: 0 0 var(--app-space-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
