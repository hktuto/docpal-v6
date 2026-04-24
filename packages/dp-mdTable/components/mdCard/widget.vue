<script setup lang="ts">
import { Rank } from '@element-plus/icons-vue'
interface Props {
  row: Record<string, any>
  fields: any[]
  styleConfig: {
    showCover?: boolean
    coverField?: string
    stretchCover?: boolean
    showFieldName?: boolean
    bordered?: boolean
    compact?: boolean
    shadow?: 'none' | 'small' | 'hover'
  }
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  row: () => ({}),
  fields: () => [],
  styleConfig: () => ({
    showCover: true,
    coverField: '',
    stretchCover: true,
    showFieldName: true,
    bordered: true,
    compact: false,
    shadow: 'small',
    cardCount: 5
  }),
  draggable: false
})

const emit = defineEmits<{
  'open-record': [row: any]
}>()

const previewFields = computed(() => {
  return props.fields.slice(0, 6)
})

const cardClass = computed(() => {
  return {
    'is-bordered': props.styleConfig.bordered !== false,
    'is-compact': !!props.styleConfig.compact,
    'shadow-none': props.styleConfig.shadow === 'none',
    'shadow-small': props.styleConfig.shadow === 'small',
    'shadow-hover': props.styleConfig.shadow === 'hover'
  }
})

const coverUrl = computed(() => {
  const selectedCoverField = props.styleConfig.coverField || ''
  if (!selectedCoverField || props.styleConfig.showCover === false) {
    return ''
  }
  const attachmentField = props.fields.find((field: any) => {
    const fieldName = field?.field_name || field?.fieldName
    return fieldName === selectedCoverField
  })
  if (!attachmentField) {
    return ''
  }
  const fieldName = attachmentField?.field_name || attachmentField?.fieldName
  const value = props.row?.[fieldName]
  if (!value) {
    return ''
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0]?.url || value[0]?.downloadUrl || ''
  }
  if (typeof value === 'string') {
    return value
  }
  return value?.url || value?.downloadUrl || ''
})

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function handleOpenRecord() {
  emit('open-record', props.row)
}
</script>

<template>
  <div
    class="md-card-widget"
    :class="cardClass"
    tabindex="0"
    aria-label="打开记录"
    :style="{ '--card-count': styleConfig.cardCount }"
    @click="handleOpenRecord"
    @keydown.enter="handleOpenRecord"
  >
    <!-- <div
      v-if="draggable"
      class="card-drag-handle drag-handle"
      tabindex="0"
      aria-label="拖拽调整顺序"
      @mousedown.stop
      @click.stop
      @keydown.enter.stop
    >
      <el-icon :size="16">
        <Rank />
      </el-icon>
    </div> -->

    <div v-if="!!styleConfig.coverField && styleConfig.showCover !== false" class="card-cover" :class="{ stretch: !!styleConfig.stretchCover }">
      <img v-if="coverUrl" :src="coverUrl" alt="cover" />
      <div v-else class="cover-placeholder">No Cover</div>
    </div>

    <div class="card-content" >
      <div v-for="(field, index) in previewFields" :key="field.field_name" :class="{ 'card-row': true, 'is-title': index === 0 }">
        <span v-if="styleConfig.showFieldName !== false && index > 0" class="field-name">{{ field.field_name_alias || field.field_name }}</span>
        <span class="field-value">{{ formatValue(row?.[field.field_name]) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.md-card-widget {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  position: relative;

  &.is-bordered {
    border: 1px solid #ebeef5;
  }

  &.shadow-none {
    box-shadow: none;
  }

  &.shadow-small {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  &.shadow-hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.14);
    }
  }

  &.is-compact {
    .card-content {
      padding: 8px;
    }

    .card-row {
      margin-bottom: 2px;
    }
  }
}

.md-card-widget.md-card-ghost {
  opacity: 0.6;
}

.card-drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(235, 238, 245, 0.95);
  color: var(--app-text-color-secondary);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.card-cover {
  height: calc(200px + (8 - var(--card-count)) * 20px);
  flex-shrink: 0;
  overflow: hidden;
  background: var(--app-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;

  &.stretch img {
    object-fit: cover;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .cover-placeholder {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.card-content {
  padding: 12px;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12px;
}

.field-name {
  color: var(--app-text-color-secondary);
}

.field-value {
  color: var(--app-text-color-primary);
  font-size: var(--app-font-size-l);
  word-break: break-word;
}

.card-row.is-title {
  .field-value {
    font-size: var(--app-font-size-xl);
    font-weight: 700;
    line-height: 1.5;
  }
}
</style>
