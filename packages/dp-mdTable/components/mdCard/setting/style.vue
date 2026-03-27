<script setup lang="ts">
import { ColumnFieldType } from '../../../types/column-types'

/** 与视图持久化 style（viewStyleConfig）字段一致 */
const CARD_STYLE_DEFAULTS = {
  cardCount: 5,
  coverFieldId: '',
  isColNameVisible: true,
  isCoverFit: true,
  showCover: false,
  isBordered: true,
  isCompact: false,
  cardShadow: 'small' as const
}

const { tableFields, viewStyleConfig, updateViewFilterSortGroup, updatedViewColumnsConfig, columns } = useMDCardInject()

const mergedStyle = computed(() => ({
  ...CARD_STYLE_DEFAULTS,
  ...(viewStyleConfig?.value || {})
}))

function persistStyle(patch: Record<string, any>) {
  const next = { ...mergedStyle.value, ...patch }
  void updateViewFilterSortGroup?.('style', next)
}

function updatePartial(payload: Record<string, any>) {
  persistStyle(payload)
}

const coverOptions = computed(() => {
  const documentTypes = new Set([ColumnFieldType.Document, Number(ColumnFieldType.Document), 'Document', 'document'])
  const documentFields = (tableFields.value || []).filter((field: any) => {
    return documentTypes.has(field.business_type)
  })
  return documentFields.map((field: any) => ({
    label: field.field_name_alias || field.field_name,
    value: field.field_name
  }))
})

function handleCoverFieldChange(value: string) {
  const hasCover = !!value
  updatePartial({
    coverFieldId: value,
    showCover: hasCover
  })
}

const columnVisibilityList = computed(() => {
  const visibleFieldNameSet = new Set((columns?.value || []).map((col: any) => col.field_name))
  return (tableFields.value || []).map((field: any) => ({
    id: field.id,
    title: field.field_name_alias || field.field_name || field.id,
    display: visibleFieldNameSet.has(field.field_name)
  }))
})

async function handleColumnVisibilityChange(fieldId: string, display: boolean) {
  if (!updatedViewColumnsConfig) return
  await updatedViewColumnsConfig([{ id: fieldId, display }])
}

async function handleHideAllColumns() {
  if (!updatedViewColumnsConfig) return
  const updates = (tableFields.value || []).map((field: any) => ({ id: field.id, display: false }))
  await updatedViewColumnsConfig(updates)
}

async function handleShowAllColumns() {
  if (!updatedViewColumnsConfig) return
  const updates = (tableFields.value || []).map((field: any) => ({ id: field.id, display: true }))
  await updatedViewColumnsConfig(updates)
}
</script>

<template>
  <div class="md-card-style-setting">
    <div class="setting-title">设置卡片样式</div>
    <div class="setting-row">
      <span>封面</span>
      <el-select
        :model-value="mergedStyle.coverFieldId || ''"
        style="width: 180px"
        @update:model-value="(v) => handleCoverFieldChange(String(v ?? ''))"
      >
        <el-option label="无封面" value="" />
        <el-option v-for="option in coverOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </div>
    <div class="setting-row">
      <span>拉伸</span>
      <el-switch :model-value="mergedStyle.isCoverFit" @update:model-value="(v) => updatePartial({ isCoverFit: !!v })" />
    </div>
    <div class="setting-row">
      <span>显示列名</span>
      <el-switch
        :model-value="mergedStyle.isColNameVisible"
        @update:model-value="(v) => updatePartial({ isColNameVisible: !!v })"
      />
    </div>
    <div class="setting-row">
      <span>边框</span>
      <el-switch :model-value="mergedStyle.isBordered" @update:model-value="(v) => updatePartial({ isBordered: !!v })" />
    </div>
    <div class="setting-row">
      <span>紧凑</span>
      <el-switch :model-value="mergedStyle.isCompact" @update:model-value="(v) => updatePartial({ isCompact: !!v })" />
    </div>
    <div class="setting-row shadow-row">
      <span>阴影</span>
      <el-segmented
        :model-value="mergedStyle.cardShadow"
        :options="[
          { label: '无', value: 'none' },
          { label: '小', value: 'small' },
          { label: '悬浮', value: 'hover' }
        ]"
        @change="(v) => updatePartial({ cardShadow: v as 'none' | 'small' | 'hover' })"
      />
    </div>
    <div class="setting-title column-title">列显示与隐藏</div>
    <div class="column-list">
      <div v-for="column in columnVisibilityList" :key="column.id" class="column-item">
        <span class="column-name">{{ column.title }}</span>
        <el-switch :model-value="column.display" @update:model-value="(v) => handleColumnVisibilityChange(column.id, !!v)" />
      </div>
    </div>
    <div class="column-actions">
      <el-button size="small" @click="handleHideAllColumns">隐藏所有</el-button>
      <el-button size="small" type="primary" @click="handleShowAllColumns">显示所有</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.md-card-style-setting {
  .setting-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #606266;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    color: #606266;
    font-size: 13px;
  }

  .shadow-row {
    align-items: flex-start;
  }

  .column-title {
    margin-top: 12px;
  }

  .column-list {
    max-height: 220px;
    overflow-y: auto;
    margin-bottom: 8px;
  }

  .column-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .column-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .column-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
