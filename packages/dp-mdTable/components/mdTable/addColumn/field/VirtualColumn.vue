<template>
  <div class="virtual-column-config">
    <!-- Source Info (Read-only) -->
    {{menus}}
    <div class="source-info">
      <div class="info-item">
        <span class="label">Source Relation:</span>
        <span class="value">{{ formData.sourceRelationField || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="label">Display Field:</span>
        <span class="value">{{ formData.displayFieldName || '-' }}</span>
      </div>
    </div>

    <!-- Target Field Info -->
    <el-alert 
      v-if="targetTypeName" 
      type="info" 
      :closable="false"
      class="target-info-alert"
    >
      <template #title>
        Display type: {{ targetTypeName }}
      </template>
      <span class="target-info-desc">
        This column inherits display settings from the target table.
      </span>
    </el-alert>

    <el-divider />

    <!-- Aggregation Settings (Virtual Column specific) -->
    <el-form-item label="Value Aggregation">
      <el-radio-group v-model="formData.aggregation">
        <el-radio-button value="all">Show All</el-radio-button>
        <el-radio-button value="first">First</el-radio-button>
        <el-radio-button value="last">Last</el-radio-button>
        <el-radio-button value="count">Count</el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Options">
      <div class="options-list">
        <el-checkbox v-model="formData.showUniqueOnly">
          Show Unique Values Only
        </el-checkbox>
        <el-checkbox v-model="formData.linkToRecord">
          Link to Related Record
        </el-checkbox>
      </div>
    </el-form-item>

    <el-form-item v-if="formData.aggregation === 'all'" label="Separator">
      <el-input 
        v-model="formData.separator" 
        placeholder=", "
        style="width: 100px"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ColumnFieldType, reverseColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
}>()

const { menus } = useVirtualColumn()
// Get target field type name from targetFieldConfig
const targetTypeName = computed(() => {
  const type = props.formData?.targetFieldConfig?.type
  if (!type) return null
  return reverseColumnFieldType[type] || 'Text'
})

// Initialize form data with defaults
const initializeFormData = () => {
  if (props.formData.aggregation === undefined) {
    props.formData.aggregation = 'all'
  }
  if (props.formData.showUniqueOnly === undefined) {
    props.formData.showUniqueOnly = false
  }
  if (props.formData.linkToRecord === undefined) {
    props.formData.linkToRecord = false
  }
  if (props.formData.separator === undefined) {
    props.formData.separator = ', '
  }
}

onMounted(() => {
  initializeFormData()
})
</script>

<style scoped lang="scss">
.virtual-column-config {
  .source-info {
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    padding: 12px;
    margin-bottom: 8px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;

    .label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .value {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      font-family: monospace;
    }
  }

  .target-info-alert {
    margin-top: 12px;
    
    .target-info-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.el-divider) {
    margin: 12px 0;
  }

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
