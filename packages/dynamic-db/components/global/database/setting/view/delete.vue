<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CaseViewRecord } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()


const { deleteItem } = useSingleDatabaseContext()

const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)

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
    }
  } catch (error) {
    console.error('Error loading view data:', error)
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!props.menuItem) return

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the view "${viewData.value?.name || props.menuItem.label}"? This action cannot be undone. The underlying table data will not be affected.`,
      'Delete View',
      {
        confirmButtonText: 'Delete View',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    loading.value = true

    // Delete the view record
    if (viewData.value) {
      await query(`DELETE FROM case_views WHERE id = $1`, [viewData.value.id])
    }

    // Delete the menu item
    await deleteItem(props.menuItem.id)

    ElMessage.success('View deleted successfully')
  } catch (e) {
    // User cancelled or error
    if (e !== 'cancel') {
      console.error('Error deleting view:', e)
      ElMessage.error('Failed to delete view')
    }
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
  <div class="view-delete-settings">
    <div class="section-header">
      <h2>Delete View</h2>
      <p>Permanently delete this view from your workspace.</p>
    </div>

    <el-alert
      title="Warning"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>Deleting this view will:</p>
        <ul>
          <li>Remove the view from your workspace menu</li>
          <li>Delete all view configurations (filters, sorting, grouping)</li>
        </ul>
        <p><strong>Note:</strong> The underlying table data will NOT be deleted.</p>
      </template>
    </el-alert>

    <div class="delete-action">
      <el-button
        type="danger"
        size="large"
        :loading="loading"
        @click="handleDelete"
      >
        <Icon name="lucide:trash-2" />
        Delete View
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.view-delete-settings {
  max-width: 600px;
}

.section-header {
  margin-bottom: var(--app-space-l);

  h2 {
    margin: 0 0 var(--app-space-xs);
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--el-color-danger);
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
}

.el-alert {
  margin-bottom: var(--app-space-l);

  p {
    margin: 0 0 var(--app-space-s);
  }

  ul {
    margin: 0 0 var(--app-space-s);
    padding-left: var(--app-space-l);
  }
}

.delete-action {
  .el-button {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
