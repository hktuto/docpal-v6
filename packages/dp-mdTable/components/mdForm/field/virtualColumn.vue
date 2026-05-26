<template>
  <MdFormItem v-if="formData && column[fieldName]" v-bind="props">
    <div
      class="virtual-column-readonly"
      tabindex="0"
      role="group"
      :aria-label="readonlyAriaLabel"
    >
      <template v-if="!virtualProps.display_field_name">
        <span class="virtual-column-empty">-</span>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.SingleSelect">
        <span v-if="!cellValues.length" class="virtual-column-empty">-</span>
        <div v-else class="select-tags">
          <div
            v-for="(label, index) in singleSelectLabels"
            :key="index"
            class="table-tag"
            :style="singleSelectStyles[index] ? `--color: ${singleSelectStyles[index]}` : undefined"
          >
            {{ label }}
          </div>
        </div>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.MultiSelect">
        <span v-if="!cellValues.length" class="virtual-column-empty">-</span>
        <div v-else class="select-tags">
          <div v-for="(label, index) in multiSelectLabels" :key="index" class="table-tag" style="--color: #dddddd">
            {{ label }}
          </div>
        </div>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.Number">
        <span>{{ formattedNumbers }}</span>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.DateTime">
        <span>{{ formattedDateTimes }}</span>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.Email">
        <span v-if="!cellValues.length" class="virtual-column-empty">-</span>
        <template v-else-if="cellValues.length === 1">
          <a class="virtual-link" :href="`mailto:${cellValues[0]}`">{{ cellValues[0] || '-' }}</a>
        </template>
        <div v-else class="tags-wrap">
          <a v-for="(val, index) in cellValues" :key="index" class="virtual-link" :href="`mailto:${val}`">{{ val }}</a>
        </div>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.URL">
        <span v-if="!cellValues.length" class="virtual-column-empty">-</span>
        <div v-else class="tags-wrap">
          <a
            v-for="(val, index) in cellValues"
            :key="index"
            class="virtual-link"
            :href="String(val)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ val }}
          </a>
        </div>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.Phone">
        <span v-if="!cellValues.length" class="virtual-column-empty">-</span>
        <template v-else-if="cellValues.length === 1">
          <a class="virtual-link" :href="`tel:${cellValues[0]}`">{{ cellValues[0] || '-' }}</a>
        </template>
        <div v-else class="tags-wrap">
          <a v-for="(val, index) in cellValues" :key="index" class="virtual-link" :href="`tel:${val}`">{{ val }}</a>
        </div>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.Checkbox">
        <span>{{ checkboxSummary }}</span>
      </template>
      <template v-else-if="virtualProps.display_field_type === ColumnFieldType.Rating">
        <span class="rating-text">{{ ratingDisplay }}</span>
      </template>
      <template v-else>
        <span v-if="!relationArray.length" class="virtual-column-empty">-</span>
        <div v-else class="tags-wrap">
          <el-tag v-for="(item, index) in relationArray" :key="index" size="small" type="info">
            {{ formatDefaultCell(item) }}
          </el-tag>
        </div>
      </template>
    </div>
  </MdFormItem>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { buildRelationArray } from '@packages/dp-mdTable/utils/relationHelper'

const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()

const virtualProps = computed(() => ({
  ...(props.column?.display_structure ?? {}),
  ...(props.column?.cellRender?.props ?? {})
}))

const relationArray = computed(() => {
  const fieldName = virtualProps.value.display_field_name
  const relationFieldName = virtualProps.value.relation_field_name
  if (!fieldName || !relationFieldName || !props.formData) {
    return []
  }
  return buildRelationArray(props.formData, relationFieldName, fieldName)
})

const cellValues = computed(() => {
  const fieldName = virtualProps.value.display_field_name
  if (!fieldName) {
    return []
  }
  return relationArray.value.map((item: Record<string, unknown>) => item[fieldName])
})

const separator = computed(() => virtualProps.value.separator ?? ', ')

const readonlyAriaLabel = computed(() => {
  const title = props.column?.title ?? props.column?.field_name_alias ?? ''
  return title ? `${title}（只读，关联展示）` : '关联展示字段（只读）'
})

const selectOptions = computed(() => {
  const cfg = virtualProps.value
  return cfg?.properties?.options ?? cfg?.options ?? []
})

const singleSelectLabels = computed(() => {
  return cellValues.value.map((val: unknown) => resolveOptionLabel(val, selectOptions.value))
})

const singleSelectStyles = computed(() => {
  return cellValues.value.map((val: unknown) => resolveOptionColor(val, selectOptions.value))
})

const multiSelectLabels = computed(() => {
  return cellValues.value.map((val: unknown) => {
    const vals = Array.isArray(val) ? val : [val]
    const labels = vals.map((v: unknown) => resolveOptionLabel(v, selectOptions.value))
    return labels.length ? labels.join(separator.value) : '-'
  })
})

const numberProps = computed(() => virtualProps.value.properties ?? virtualProps.value ?? {})

const formattedNumbers = computed(() => {
  if (!cellValues.value.length) {
    return '-'
  }
  const precision = numberProps.value.precision ?? 0
  const showThouComma = numberProps.value.showThouComma ?? false
  const symbol = numberProps.value.symbol
  const symbolAlign = numberProps.value.symbolAlign || 'left'
  const parts = cellValues.value.map((val: unknown) => {
    if (val == null || Number.isNaN(Number(val))) {
      return String(val ?? '-')
    }
    let formatted = Number(val).toFixed(precision)
    if (showThouComma) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    if (symbol) {
      formatted = symbolAlign === 'left' ? symbol + formatted : formatted + symbol
    }
    return formatted
  })
  return parts.join(separator.value)
})


const formattedDateTimes = computed(() => {
  if (!cellValues.value.length) {
    return '-'
  }
  const df = virtualProps.value.dateFormat || 'YYYY-MM-DD'
  const includeTime = virtualProps.value.includeTime || false
  const dateTimeFormat = virtualProps.value.dateTimeFormat || 'HH:mm'
  const format = includeTime ? `${df} ${dateTimeFormat}` : df
  return cellValues.value
    .map((val: unknown) => {
      if (!val) {
        return '-'
      }
      return dayjs(val as string | number | Date).format(format)
    })
    .join(separator.value)
})

const checkboxSummary = computed(() => {
  if (!cellValues.value.length) {
    return '-'
  }
  if (cellValues.value.length === 1) {
    return Boolean(cellValues.value[0]) ? '✓' : '✗'
  }
  const checkedCount = cellValues.value.filter(Boolean).length
  return `${checkedCount}/${cellValues.value.length} ✓`
})

const ratingDisplay = computed(() => {
  const cfg = virtualProps.value
  const maxRating = cfg?.max ?? cfg?.maxRating ?? 5
  if (!cellValues.value.length) {
    return '-'
  }
  if (cellValues.value.length === 1) {
    const rating = Number(cellValues.value[0]) || 0
    const stars = '★'.repeat(Math.min(rating, maxRating)) + '☆'.repeat(Math.max(0, maxRating - rating))
    return stars
  }
  const avg = cellValues.value.reduce((sum: number, v: unknown) => sum + (Number(v) || 0), 0) / cellValues.value.length
  return `Avg: ${avg.toFixed(1)} ★`
})

function formatDefaultCell(item: Record<string, unknown>) {
  const fieldName = virtualProps.value.display_field_name
  if (!fieldName) {
    return '-'
  }
  const raw = item[fieldName]
  return raw == null || raw === '' ? '-' : String(raw)
}

function resolveOptionLabel(val: unknown, options: any[]) {
  const option = options.find((o: any) => o.id === val || o.value === val || o.label === val)
  return option?.label ?? String(val ?? '-')
}

function resolveOptionColor(val: unknown, options: any[]) {
  const option = options.find((o: any) => o.id === val || o.value === val || o.label === val)
  return option?.color ?? ''
}
</script>

<style scoped lang="scss">
.virtual-column-readonly {
  width: 100%;
  min-height: 32px;
  line-height: 1.5;
}

.virtual-column-empty {
  color: var(--el-text-color-secondary);
}

.select-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.table-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--el-border-radius-base);
  font-size: 12px;
  background: color-mix(in srgb, var(--color, var(--el-color-info-light-7)) 35%, transparent);
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.virtual-link {
  color: var(--el-color-primary);
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.rating-text {
  color: #f7ba2a;
  letter-spacing: 1px;
}
</style>
