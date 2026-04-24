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
        <div v-if="fields?.length > 0 && fields?.[0]?.field_name" class="relation-card-title">
          {{ formatFieldValue(fields[0].field_name) }}
        </div>
        <div v-if="fields?.length > 1" class="relation-card-fields">
          <template v-for="(field, index) in fields">
            <div v-if="index > 0 && index < 5" :key="field.field_name" class="relation-card-field">
              <div class="field-label" :title="field.field_name_alias">{{ field.field_name_alias }}</div>
              <div class="field-value" :title="formatFieldValue(field.field_name)">
                <!-- 单选：标签 -->
                <template v-if="[ColumnFieldType.SingleSelect, ColumnFieldType.MultiSelect].includes(field.business_type)">
                  <template v-if="getSelectOption(field)?.length">
                    <span v-for="opt in getSelectOption(field)" :key="opt.id" class="value-tag" :style="{ '--tag-color': opt?.color }">
                      {{ opt?.label || opt?.name }}
                    </span>
                  </template>
                  <template v-else>
                    <span>-</span>
                  </template>
                </template>
                <template v-else>
                  {{ formatFieldValue(field) }}
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
import { formatFieldValueByType } from '@packages/dp-mdTable/utils/fieldValueFormat'

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
function getFieldName(field: FieldInfo) {
  console.log(field, 'getFieldName')
  return field.field_name
}
function getSelectOption(field: FieldInfo) {
  const fieldName = getFieldName(field)
  const fieldValues = Array.isArray(recordData.value[fieldName]) ? recordData.value[fieldName] : [recordData.value[fieldName]]
  if (!fieldValues?.length) return []
  const options = field.options
  return fieldValues.reduce((acc: any[], v: any) => {
    const option = options?.find((o: any) => o.id === v)
    if (option) {
      acc.push(option)
    }
    return acc
  }, [])
}
function formatFieldValue(field: FieldInfo): string {
  return formatFieldValueByType(recordData.value[field.field_name], {
    ...field,
    properties: field,
    type: field?.business_type
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
  margin-right: var(--app-space-xs);
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--tag-color, var(--el-fill-color));
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.relation-card-main {
  display: flex;
  flex: 1;
  min-width: 0;
  margin-top: var(--app-space-xs);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-s);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  position: relative;
  overflow: hidden;
  &.selected {
    border-color: var(--el-color-primary);
    &:after {
      content: ' ';
      z-index: 1;
      left: 3px;
      top: 6px;
      width: 4px;
      height: 8px;
      position: absolute;
      display: table;
      border: 1px solid #fff;
      border-top: 0;
      border-left: 0;
      transform: rotate(45deg) scale(1) translate(-50%, -50%);
      opacity: 1;
      transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46) 0.1s;
    }
    &:before {
      content: ' ';
      z-index: 1;
      width: 31px;
      height: 31px;
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%) rotate(45deg);
      background-color: var(--app-primary-color);
    }
  }
}
</style>
