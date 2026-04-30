<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/workspace/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'

const { workspaceRouteParams, findItemById, menuState, saveMenuItemToDb } = useSingleWorkspaceContext()
const { query } = usePglite()

const fieldsData = ref<CaseFieldRecord[]>([])

const loading = ref(false)
const formData = ref({
  name: '',
  description: ''
})

async function loadTableData() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.item_type !== 'master_table' || !treeItem.item_id) return
  formData.value.name = treeItem.name
  formData.value.description = treeItem.description || ''
}

async function handleSaveGeneral() {
  try {
    loading.value = true
    await saveMenuItemToDb({ ...formData.value, id: workspaceRouteParams.value.detailId })
    const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
    if (treeItem) {
      treeItem.name = formData.value.name
      treeItem.description = formData.value.description || null
    }
    ElMessage.success('Settings saved successfully')
  } catch (error) {
    console.error('Error saving table:', error)
    ElMessage.error('Failed to save settings')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTableData()
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    loadTableData()
  }
)
</script>

<template>
  <el-card class="setting-section">
    <template #header>
      <div class="card-header">
        <h3>General</h3>
      </div>
    </template>
    <el-form :model="formData" label-position="top" class="setting-form">
      <el-form-item label="Table Name">
        <el-input v-model="formData.name" placeholder="Enter table name" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="Enter table description" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSaveGeneral"> Save Changes </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }
}

.setting-form {
  max-width: 600px;
}

.columns-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--app-space-s);
  background: var(--app-grey-50);
  border-radius: var(--app-border-radius);
}
</style>
