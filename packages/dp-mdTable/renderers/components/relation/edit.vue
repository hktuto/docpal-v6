<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'
import { useColumnsContext } from '../../../composables/useColumns'

interface RelationOption {
  id: string
  label: string
  raw: any
}

const props = defineProps<{
  modelValue: string[] | string | null
  relationTableId: string
  displayField: string
  multiple?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[] | string | null): void
}>()

// Get the column context to access queryRelatedTable
const { queryRelatedTable } = useColumnsContext()

// Loading state
const loading = ref(false)

// Options for the dropdown
const options = ref<RelationOption[]>([])

// Search query
const searchQuery = ref('')

// Pagination
const pageNum = ref(1)
const pageSize = ref(50)
const hasMore = ref(true)

// Selected values (normalized to array)
const selectedValues = computed({
  get: () => {
    if (!props.modelValue) return props.multiple !== false ? [] : ''
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// Fetch options from the related table
async function fetchOptions(keyword: string = '', reset: boolean = true) {
  if (!queryRelatedTable || !props.relationTableId) {
    console.warn('queryRelatedTable not available or relationTableId not provided')
    return
  }

  if (reset) {
    pageNum.value = 1
    options.value = []
    hasMore.value = true
  }

  if (!hasMore.value && !reset) return

  loading.value = true
  try {
    const result = await queryRelatedTable(props.relationTableId, {
      keyword,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sortBy: props.displayField || 'id',
      sortOrder: 'asc'
    })

    const newOptions = result.rows.map((row: any) => ({
      id: row.id,
      label: row[props.displayField] || row.id,
      raw: row
    }))

    if (reset) {
      options.value = newOptions
    } else {
      // Merge with existing options, avoiding duplicates
      const existingIds = new Set(options.value.map(o => o.id))
      const uniqueNewOptions = newOptions.filter((o: RelationOption) => !existingIds.has(o.id))
      options.value.push(...uniqueNewOptions)
    }

    hasMore.value = newOptions.length === pageSize.value
  } catch (error) {
    console.error('Error fetching relation options:', error)
  } finally {
    loading.value = false
  }
}

// Handle search input
const debouncedSearch = useDebounceFn((keyword: string) => {
  fetchOptions(keyword, true)
}, 300)

function handleSearch(keyword: string) {
  searchQuery.value = keyword
  debouncedSearch(keyword)
}

// Handle scroll to bottom (infinite scroll)
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  const scrollBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 20
  
  if (scrollBottom && !loading.value && hasMore.value) {
    pageNum.value++
    fetchOptions(searchQuery.value, false)
  }
}

// Initial fetch
onMounted(() => {
  fetchOptions('', true)
})

// Get option label by ID for display
function getOptionLabel(id: string): string {
  const option = options.value.find(o => o.id === id)
  return option?.label || id
}
</script>

<template>
  <ElSelect
    v-model="selectedValues"
    :multiple="multiple !== false"
    :placeholder="placeholder || 'Select...'"
    :loading="loading"
    filterable
    remote
    :remote-method="handleSearch"
    class="vxe-cell-absolute mdTable-input-radius mdTable-height-edit"
    popper-class="vxe-table--ignore-clear relation-select-dropdown"
    @visible-change="(visible: boolean) => visible && fetchOptions(searchQuery, true)"
  >
    <ElOption
      v-for="option in options"
      :key="option.id"
      :label="option.label"
      :value="option.id"
    />
    <template #empty>
      <div v-if="loading" class="relation-select-loading">
        Loading...
      </div>
      <div v-else class="relation-select-empty">
        No results found
      </div>
    </template>
  </ElSelect>
</template>

<style scoped>
.relation-select-loading,
.relation-select-empty {
  padding: 8px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
