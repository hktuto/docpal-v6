<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseViewRecord, ViewFilter } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()

const { query } = usePglite()

const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const filters = ref<ViewFilter[]>([])

async function loadData() {
  if (!props.menuItem?.itemId) return
  
  loading.value = true
  try {
    const views = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE id = $1`,
      [props.menuItem.itemId]
    )
    
    if (views.length > 0) {
      viewData.value = views[0]
      filters.value = views[0].filter || []
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => props.menuItem?.itemId, () => {
  loadData()
})
</script>

<template>
  <div class="view-filters-settings">
    <div class="section-header">
      <h2>Filters</h2>
      <p>Configure default filters for this view.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else>
      <el-alert
        title="Filter Configuration"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>Filters can be configured directly in the view using the toolbar filter options.</p>
          <p v-if="filters.length > 0">
            This view has <strong>{{ filters.length }}</strong> active filter(s).
          </p>
          <p v-else>
            No filters are currently applied to this view.
          </p>
        </template>
      </el-alert>

      <!-- Current Filters Display -->
      <div v-if="filters.length > 0" class="current-filters">
        <h3>Active Filters</h3>
        <div class="filter-list">
          <div v-for="(filter, index) in filters" :key="index" class="filter-item">
            <el-tag>
              {{ filter.field }} {{ filter.operator }} {{ filter.value }}
            </el-tag>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-filters-settings {
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

.loading-state {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  color: var(--el-text-color-secondary);
  padding: var(--app-space-l);
}

.el-alert {
  p {
    margin: 0 0 var(--app-space-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.current-filters {
  margin-top: var(--app-space-l);
  
  h3 {
    margin: 0 0 var(--app-space-s);
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
}

.filter-item {
  .el-tag {
    font-family: monospace;
  }
}
</style>
