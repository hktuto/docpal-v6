<template>
  <div class="virtual-column-config">
    <!-- Source Info (Read-only) -->
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

    <el-divider />

    <!-- Display Settings -->
    <el-form-item label="Display Mode">
      <el-select v-model="formData.displayMode" style="width: 100%">
        <el-option value="text" label="Text (comma-separated)" />
        <el-option value="chips" label="Chips/Tags" />
        <el-option value="list" label="List (vertical)" />
        <el-option value="link" label="Link (clickable)" />
      </el-select>
    </el-form-item>

    <el-form-item label="Aggregation">
      <el-select v-model="formData.aggregation" style="width: 100%">
        <el-option value="all" label="Show All Values" />
        <el-option value="first" label="First Value Only" />
        <el-option value="last" label="Last Value Only" />
        <el-option value="count" label="Count" />
      </el-select>
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

    <el-form-item v-if="formData.displayMode === 'text'" label="Separator">
      <el-input 
        v-model="formData.separator" 
        placeholder=", "
        style="width: 100px"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  formData: any
}>()

// Initialize form data with defaults
const initializeFormData = () => {
  if (props.formData.displayMode === undefined) {
    props.formData.displayMode = 'text'
  }
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

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.el-divider) {
    margin: 12px 0;
  }
}
</style>
