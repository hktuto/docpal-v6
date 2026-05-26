<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/workspace/useSingleDatabase'
import type { CaseTableRecord } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  activeSubSection?: string
}>()

const { databaseMenuRouteParams, findItemById, menuState } = useSingleDatabaseContext()


const tableData = ref<CaseTableRecord | null>(null)

const formData = ref({
  formStyle: 'default',
  cardStyle: 'default',
  listStyle: 'default',
  detailStyle: 'default'
})

const sectionTitle = computed(() => {
  switch (props.activeSubSection) {
    case 'detail':
      return 'Detail View'
    case 'form':
      return 'Form Style'
    case 'card':
      return 'Card Style'
    case 'list':
      return 'List Style'
    default:
      return 'Data'
  }
})

const sectionDescription = computed(() => {
  switch (props.activeSubSection) {
    case 'detail':
      return 'Configure how individual records are displayed in detail view'
    case 'form':
      return 'Configure how data entry forms are displayed'
    case 'card':
      return 'Configure how records are displayed in card view'
    case 'list':
      return 'Configure how records are displayed in list view'
    default:
      return 'Configure how data is displayed in different views'
  }
})

async function loadTableData() {
  const treeItem = findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId || '')
  if (!treeItem || treeItem.item_type !== 'table' || !treeItem.itemId) return

  try {
    const tables = await query<CaseTableRecord[]>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [treeItem.itemId]
    )

    if (tables.length > 0) {
      tableData.value = tables[0]

      if (tableData.value.formStructure) {
        formData.value.formStyle = tableData.value.formStructure.form || 'default'
        formData.value.cardStyle = tableData.value.formStructure.card || 'default'
        formData.value.listStyle = tableData.value.formStructure.list || 'default'
        formData.value.detailStyle = tableData.value.formStructure.detail || 'default'
      }
    }
  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  }
}

async function handleSaveDataStyles() {
  if (!tableData.value) return

  try {
    const now = new Date().toISOString()
    const formStructure = {
      form: formData.value.formStyle,
      card: formData.value.cardStyle,
      list: formData.value.listStyle,
      detail: formData.value.detailStyle
    }

    await query(
      `UPDATE case_tables
       SET "formStructure" = $1, "updatedAt" = $2
       WHERE id = $3`,
      [JSON.stringify(formStructure), now, tableData.value.id]
    )

    ElMessage.success(`${sectionTitle.value} saved successfully`)
  } catch (error) {
    console.error('Error saving data styles:', error)
    ElMessage.error('Failed to save data styles')
  }
}

onMounted(() => {
  loadTableData()
})

watch(
  () => databaseMenuRouteParams.value.detailId,
  () => {
    loadTableData()
  }
)
</script>

<template>
  <el-card class="setting-section">
    <template #header>
      <div class="card-header">
        <h3>{{ sectionTitle }}</h3>
      </div>
    </template>

    <div class="description">
      {{ sectionDescription }}
    </div>

    <el-form :model="formData" label-position="top" class="setting-form">
      <!-- Detail View Settings -->
      <template v-if="activeSubSection === 'detail'">
        <el-form-item label="Detail Style">
          <el-select v-model="formData.detailStyle" style="width: 100%">
            <el-option label="Default" value="default" />
            <el-option label="Compact" value="compact" />
            <el-option label="Wide" value="wide" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Form Settings -->
      <template v-if="activeSubSection === 'form'">
        <el-form-item label="Form Style">
          <el-select v-model="formData.formStyle" style="width: 100%">
            <el-option label="Default" value="default" />
            <el-option label="Compact" value="compact" />
            <el-option label="Detailed" value="detailed" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Card Settings -->
      <template v-if="activeSubSection === 'card'">
        <el-form-item label="Card Style">
          <el-select v-model="formData.cardStyle" style="width: 100%">
            <el-option label="Default" value="default" />
            <el-option label="Minimal" value="minimal" />
            <el-option label="Rich" value="rich" />
          </el-select>
        </el-form-item>
      </template>

      <!-- List Settings -->
      <template v-if="activeSubSection === 'list'">
        <el-form-item label="List Style">
          <el-select v-model="formData.listStyle" style="width: 100%">
            <el-option label="Default" value="default" />
            <el-option label="Compact" value="compact" />
            <el-option label="Expanded" value="expanded" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" @click="handleSaveDataStyles">
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

  .description {
    color: var(--app-grey-500);
    font-size: var(--app-font-size-s);
    margin-bottom: var(--app-space-m);
  }
}

.setting-form {
  max-width: 600px;
}
</style>
