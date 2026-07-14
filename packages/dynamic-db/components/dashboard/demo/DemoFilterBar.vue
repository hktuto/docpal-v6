<template>
  <div class="demo-filter-bar">
    <div v-for="def in inlineDefs" :key="def.field" class="demo-filter-item">
      <span class="demo-filter-label">{{ def.label }}</span>
      <el-select
        v-if="def.type === 'select'"
        :model-value="selectValue(def.field)"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="1"
        size="small"
        placeholder="全部"
        style="width: 150px"
        @update:model-value="setFilter(def.field, $event)"
      >
        <el-option v-for="opt in def.options" :key="opt" :label="opt" :value="opt" />
      </el-select>
      <el-date-picker
        v-else
        :model-value="modelValue[def.field]"
        type="daterange"
        value-format="YYYY-MM-DD"
        size="small"
        start-placeholder="開始日期"
        end-placeholder="結束日期"
        style="width: 230px"
        @update:model-value="setFilter(def.field, $event)"
      />
    </div>
    <el-popover v-if="overflowDefs.length" trigger="click" placement="bottom-end" :width="340">
      <template #reference>
        <el-badge :value="overflowActiveCount" :hidden="overflowActiveCount === 0" :max="99">
          <el-button size="small">更多</el-button>
        </el-badge>
      </template>
      <div class="demo-filter-panel">
        <div v-for="def in overflowDefs" :key="def.field" class="demo-filter-row">
          <label class="demo-filter-label">{{ def.label }}</label>
          <el-select
            v-if="def.type === 'select'"
            :model-value="selectValue(def.field)"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            size="small"
            placeholder="全部"
            style="width: 100%"
            @update:model-value="setFilter(def.field, $event)"
          >
            <el-option v-for="opt in def.options" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-date-picker
            v-else
            :model-value="modelValue[def.field]"
            type="daterange"
            value-format="YYYY-MM-DD"
            size="small"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            style="width: 100%"
            @update:model-value="setFilter(def.field, $event)"
          />
        </div>
      </div>
    </el-popover>
    <el-button v-if="activeCount" size="small" text @click="clearAll">清除全部</el-button>
  </div>
</template>

<script setup lang="ts">
import type { DemoFilterDef, DemoFilterState } from '../../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    filters: (DemoFilterDef & { options?: string[] })[]
    modelValue: DemoFilterState
    /** How many filters render inline before the rest collapse into "More". */
    inlineCount?: number
  }>(),
  { inlineCount: 3 }
)

const emit = defineEmits<{
  'update:modelValue': [value: DemoFilterState]
}>()

const inlineDefs = computed(() => props.filters.slice(0, props.inlineCount))
const overflowDefs = computed(() => props.filters.slice(props.inlineCount))

function isActive(def: DemoFilterDef): boolean {
  const val = props.modelValue[def.field]
  if (def.type === 'select') return !!((val as string[] | null)?.length)
  return !!val
}

const activeCount = computed(() => props.filters.filter(isActive).length)
const overflowActiveCount = computed(() => overflowDefs.value.filter(isActive).length)

function selectValue(field: string): string[] {
  return (props.modelValue[field] as string[]) || []
}

function setFilter(field: string, value: any) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function clearAll() {
  emit('update:modelValue', {})
}
</script>

<style scoped lang="scss">
.demo-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 6px;
  padding-inline: 6px;
}
.demo-filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.demo-filter-label {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
}
.demo-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.demo-filter-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
