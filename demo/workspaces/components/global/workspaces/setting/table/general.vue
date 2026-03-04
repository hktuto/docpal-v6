<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/workspace/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

const tableData = ref<CaseTableRecord | null>(null)
const fieldsData = ref<CaseFieldRecord[]>([])

const formData = ref({
  name: '',
  description: ''
})

async function loadTableData() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.itemType !== 'table' || !treeItem.itemId) return

  try {
    const tables = await query<CaseTableRecord[]>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [treeItem.itemId]
    )
    
    if (tables.length > 0) {
      tableData.value = tables[0]
      formData.value.name = tableData.value.name
      formData.value.description = tableData.value.description || ''
    }

    fieldsData.value = await query<CaseFieldRecord[]>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt" ASC`,
      [treeItem.itemId]
    )
  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  }
}

async function handleSaveGeneral() {
  if (!tableData.value) return

  try {
    const now = new Date().toISOString()
    await query(
      `UPDATE case_tables 
       SET name = $1, description = $2, "updatedAt" = $3
       WHERE id = $4`,
      [formData.value.name, formData.value.description, now, tableData.value.id]
    )

    const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
    if (treeItem) {
      treeItem.label = formData.value.name
    }

    ElMessage.success('Settings saved successfully')
  } catch (error) {
    console.error('Error saving table:', error)
    ElMessage.error('Failed to save settings')
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
        <el-input 
          v-model="formData.description" 
          type="textarea" 
          :rows="3"
          placeholder="Enter table description"
        />
      </el-form-item>


      <el-form-item>
        <el-button type="primary" @click="handleSaveGeneral">
          Save Changes
        </el-button>
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
