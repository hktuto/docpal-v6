<script setup lang="ts">
import type { CaseViewRecord, ViewSorting } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()



const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const sorting = ref<ViewSorting[]>([])

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
      sorting.value = views[0].sorting || []
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
  <div class="view-sorting-settings">
    <div class="section-header">
      <h2>Sorting</h2>
      <p>Configure default sorting for this view.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else>
      <el-alert
        title="Sorting Configuration"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>Sorting can be configured directly in the view using the toolbar sort options.</p>
          <p v-if="sorting.length > 0">
            This view has <strong>{{ sorting.length }}</strong> sorting rule(s).
          </p>
          <p v-else>
            No sorting rules are currently applied to this view.
          </p>
        </template>
      </el-alert>

      <!-- Current Sorting Display -->
      <div v-if="sorting.length > 0" class="current-sorting">
        <h3>Active Sorting</h3>
        <div class="sort-list">
          <div v-for="(sort, index) in sorting" :key="index" class="sort-item">
            <el-tag :type="sort.order === 'asc' ? 'success' : 'warning'">
              <Icon :name="sort.order === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" />
              {{ sort.field }}
            </el-tag>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-sorting-settings {
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

.current-sorting {
  margin-top: var(--app-space-l);

  h3 {
    margin: 0 0 var(--app-space-s);
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.sort-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
}

.sort-item {
  .el-tag {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
