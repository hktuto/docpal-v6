<script lang="ts" setup>
import type { Database, Table, DetailViewLayout } from '../../../types/database'
import { useDatabase } from '../../../composables/useDatabase'
import { ElMessage } from 'element-plus'
import DetailViewLayoutEditor from '../DetailViewLayoutEditor.vue'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { updateTable } = useDatabase()

// Layout state
const detailViewLayout = ref<DetailViewLayout | undefined>(undefined)

// Initialize
watchEffect(() => {
  detailViewLayout.value = props.table.detailViewLayout 
    ? JSON.parse(JSON.stringify(props.table.detailViewLayout))
    : undefined
})

function handleSave() {
  updateTable(props.database.id, props.table.id, {
    detailViewLayout: detailViewLayout.value
  })
  ElMessage.success('Detail view layout updated')
  emit('updated')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="header-content">
        <div>
          <h2 class="section-title">Detail View Layout</h2>
          <p class="section-description">
            Customize how record details are displayed
          </p>
        </div>
        <el-button type="primary" @click="handleSave">
          Save Layout
        </el-button>
      </div>
    </div>

    <div class="section-content">
      <DetailViewLayoutEditor
        v-model="detailViewLayout"
        :columns="table.columns"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 1200px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
  min-height: 400px;
}
</style>

