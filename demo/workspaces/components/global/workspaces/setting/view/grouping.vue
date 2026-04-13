<script setup lang="ts">
import type { CaseViewRecord, ViewGrouping } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()

const { query } = usePglite()

const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const grouping = ref<ViewGrouping[]>([])

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
      grouping.value = views[0].grouping || []
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
  <div class="view-grouping-settings">
    <div class="section-header">
      <h2>Grouping</h2>
      <p>Configure default grouping for this view.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else>
      <el-alert
        title="Grouping Configuration"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>Grouping can be configured directly in the view using the toolbar group options.</p>
          <p v-if="grouping.length > 0">
            This view has <strong>{{ grouping.length }}</strong> grouping rule(s).
          </p>
          <p v-else>
            No grouping rules are currently applied to this view.
          </p>
        </template>
      </el-alert>

      <!-- Current Grouping Display -->
      <div v-if="grouping.length > 0" class="current-grouping">
        <h3>Active Grouping</h3>
        <div class="group-list">
          <div v-for="(group, index) in grouping" :key="index" class="group-item">
            <el-tag type="primary">
              <Icon name="lucide:group" />
              {{ group.field }}
              <span v-if="group.collapsed">(collapsed)</span>
            </el-tag>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-grouping-settings {
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

.current-grouping {
  margin-top: var(--app-space-l);
  
  h3 {
    margin: 0 0 var(--app-space-s);
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
}

.group-item {
  .el-tag {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
