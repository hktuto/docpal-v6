<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CaseViewRecord, CaseTableRecord } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()


const { saveMenuItemToDb } = useSingleWorkspaceContext()

const formRef = ref<FormInstance>()
const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const baseTable = ref<CaseTableRecord | null>(null)

const formData = reactive({
  name: '',
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: 'Please enter a view name', trigger: 'blur' }]
}

const viewTypeLabels: Record<string, string> = {
  table: 'Table View',
  kanban: 'Kanban View',
  gantt: 'Gantt View',
  calendar: 'Calendar View'
}

const viewTypeIcons: Record<string, string> = {
  table: 'material-symbols:table-outline',
  kanban: 'material-symbols:view-kanban-outline',
  gantt: 'material-symbols:view-timeline-outline',
  calendar: 'material-symbols:calendar-month-outline'
}

async function loadViewData() {
  if (!props.menuItem?.itemId) return

  loading.value = true
  try {
    const views = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE id = $1`,
      [props.menuItem.itemId]
    )

    if (views.length > 0) {
      viewData.value = views[0]
      formData.name = views[0].name
      formData.description = views[0].description || ''

      // Load base table info
      const tables = await query<CaseTableRecord>(
        `SELECT * FROM case_tables WHERE id = $1`,
        [views[0].tableId]
      )
      if (tables.length > 0) {
        baseTable.value = tables[0]
      }
    }
  } catch (error) {
    console.error('Error loading view data:', error)
    ElMessage.error('Failed to load view data')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!formRef.value || !viewData.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    // Update view in database
    await query(
      `UPDATE case_views SET name = $1, description = $2, "updatedAt" = $3 WHERE id = $4`,
      [formData.name, formData.description || null, new Date(), viewData.value.id]
    )

    // Update menu item label
    if (props.menuItem) {
      await saveMenuItemToDb({
        ...props.menuItem,
        label: formData.name
      })
    }

    ElMessage.success('View settings saved')
  } catch (error) {
    console.error('Error saving view:', error)
    ElMessage.error('Failed to save view settings')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadViewData()
})

watch(() => props.menuItem?.itemId, () => {
  loadViewData()
})
</script>

<template>
  <div class="view-general-settings">
    <div class="section-header">
      <h2>View Information</h2>
      <p>Configure the basic information for this view.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else-if="viewData">
      <!-- View Type Info -->
      <div class="view-type-info">
        <div class="info-label">View Type</div>
        <div class="info-value">
          <el-tag size="large">
            <Icon :name="viewTypeIcons[viewData.viewType] || viewTypeIcons.table" />
            {{ viewTypeLabels[viewData.viewType] || 'Table View' }}
          </el-tag>
        </div>
      </div>

      <!-- Base Table Info -->
      <div v-if="baseTable" class="base-table-info">
        <div class="info-label">Base Table</div>
        <div class="info-value">
          <el-tag type="info" size="large">
            <Icon name="material-symbols:table-outline" />
            {{ baseTable.name }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <!-- Edit Form -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSave"
      >
        <el-form-item label="View Name" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="Enter view name"
          />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="Enter view description (optional)"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSave">
            Save Changes
          </el-button>
        </el-form-item>
      </el-form>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-general-settings {
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

.view-type-info,
.base-table-info {
  margin-bottom: var(--app-space-m);

  .info-label {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
    margin-bottom: var(--app-space-xs);
  }

  .info-value {
    .el-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-xs);

      .iconify {
        font-size: 16px;
      }
    }
  }
}
</style>
