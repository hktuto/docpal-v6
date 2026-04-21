<template>
  <div class="relation-card" @click="handleClick">
    <button
      v-if="showRemove"
      type="button"
      class="relation-card-remove"
      tabindex="0"
      :aria-label="$t('mdTable.relationCard.removeRelation')"
      @click.stop.prevent="handleRemove"
      @keydown.enter.stop.prevent="handleRemove"
    >
      <Icon name="lucide:minus" size="14" />
    </button>
    <div class="relation-card-main">
      <div class="relation-card-content">
        <div v-if="fields?.length > 0 && fields?.[0]?.name" class="relation-card-title">
          {{ formatFieldValue(fields[0].name) }} 
        </div>
        <div v-if="fields?.length > 1" class="relation-card-fields">
          <template v-for="(field, index) in fields">
            <div v-if="index > 0 && index < 5" :key="field.name" class="relation-card-field">
              <div class="field-label" :title="getFieldLabel(field.name)">{{ getFieldLabel(field.name) }}</div>
              <div class="field-value" :title="formatFieldValue(field.name)">
                <!-- 单选：标签 -->
                <template v-if="getFieldType(field.name) === ColumnFieldType.SingleSelect">
                  <span v-if="getSelectOption(field.name)" class="value-tag" :style="{ '--tag-color': getSelectOption(field.name)?.color }">
                    {{ getSelectOption(field.name)?.label || getSelectOption(field.name)?.name }}
                  </span>
                  <span v-else>-</span>
                </template>
                <!-- 多选：多个标签 -->
                <template v-else-if="getFieldType(field.name) === ColumnFieldType.MultiSelect">
                  <template v-if="getSelectOptions(field.name)?.length">
                    <span v-for="opt in getSelectOptions(field.name)" :key="opt.id" class="value-tag" :style="{ '--tag-color': opt?.color }">
                      {{ opt?.label || opt?.name }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </template>
                <template v-else>
                  {{ formatFieldValue(field.name) }}
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="relation-card-cover" v-if="coverField"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import {
  getSelectOption as getSelectOptionUtil,
  getSelectOptions as getSelectOptionsUtil,
  formatFieldValueByType
} from '@packages/dp-mdTable/utils/fieldValueFormat'

const props = withDefaults(
  defineProps<{
    fields: FieldInfo[]
    coverField?: string
    showRemove?: boolean
    data: Record<string, any>
  }>(),
  {
    showRemove: false
  }
)

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const { t } = useI18n()
function handleClick() {
  emit('original-click', recordData.value)
}
const recordData = computed(() => props.data || {})

function getFieldInfo(fieldName: string): FieldInfo | undefined {
  return props.fields.find((f) => f.name === fieldName)
}

function getFieldType(fieldName: string): ColumnFieldType | undefined {
  return getFieldInfo(fieldName)?.type
}

function getFieldProperties(fieldName: string): Record<string, any> {
  return getFieldInfo(fieldName)?.display_structure || {}
}

function getFieldLabel(fieldName: string): string {
  const fc = props.fields.find((f) => f.name === fieldName)
  return fc?.label || fieldName
}

function getFieldValue(fieldName: string): any {
  return recordData.value[fieldName]
}

function getSelectOption(fieldName: string) {
  return getSelectOptionUtil(getFieldValue(fieldName), getFieldProperties(fieldName))
}

function getSelectOptions(fieldName: string) {
  return getSelectOptionsUtil(getFieldValue(fieldName), getFieldProperties(fieldName))
}

function formatFieldValue(fieldName: string): string {
  const fieldInfo = getFieldInfo(fieldName)
  return formatFieldValueByType(getFieldValue(fieldName), {
    ...fieldInfo,
    properties: fieldInfo?.displayStructure?.properties,
    type: fieldInfo?.displayStructure?.type
  })
}

function handleRemove(event: MouseEvent | KeyboardEvent) {
  event.stopPropagation()
  event.preventDefault()
  emit('remove')
}
</script>

<style lang="scss" scoped>
.relation-card {
  position: relative;
  width: 100%;
}

.relation-card-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}

.relation-card-main {
  display: flex;
  flex: 1;
  min-width: 0;
}

.relation-card-content {
  flex: 1;
  padding: var(--app-space-xs);
  min-width: 0;
}

.relation-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.relation-card-fields {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.relation-card-field {
  min-width: 0;
}

.relation-card-field .field-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.relation-card-field .field-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  gap: var(--app-space-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.value-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--tag-color, var(--el-fill-color));
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
