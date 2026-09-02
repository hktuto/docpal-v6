export type SearchableSortOrder = 'asc' | 'desc'

export interface SearchableFilterSchema<T = any> {
  key: keyof T
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'date'
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

export interface UseSearchableListProps<T extends Record<string, any>> {
  data: T[]
  schema?: SearchableFilterSchema<T>[]
  zodSchema?: any
  searchKeys: (keyof T)[]
  excludeKeys: (keyof T)[]
  customLabels: Partial<Record<keyof T, string>>
  defaultSortBy?: keyof T
  defaultSortOrder: SearchableSortOrder
}

type SearchableListEmit<T> = {
  (e: 'selected', item: T): void
  (e: 'filtered', items: T[]): void
  (e: 'sortChange', payload: { sortBy: keyof T | undefined; sortOrder: SearchableSortOrder }): void
}

export function formatSearchableLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

function isSystemField(key: string) {
  if (key === '__dim' || key === 'id') return true
  if (key.endsWith('At') || key.endsWith('By') || key.includes('Token')) return true
  return ['created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'].includes(key.toLowerCase())
}

function compareValues(aVal: any, bVal: any) {
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
  }
  if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
  if (aVal instanceof Date && bVal instanceof Date) return aVal.getTime() - bVal.getTime()
  return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
}

export function useSearchableList<T extends Record<string, any>>(props: UseSearchableListProps<T>, emit: SearchableListEmit<T>) {
  const { t } = useI18n()
  const sortPopover = ref()
  const keyword = ref('')
  const filterOptions = ref<Partial<Record<keyof T, any>>>({})
  const tempFilterOptions = ref<Partial<Record<keyof T, any>>>({})
  const isFilterStage = ref(false)
  const sortBy = ref<keyof T | undefined>(props.defaultSortBy)
  const sortOrder = ref<SearchableSortOrder>(props.defaultSortOrder)
  const onSearchParamsChange = inject<((params: any) => Promise<T[]> | T[] | void) | null>('onSearchParamsChange', null)

  const hasAppliedFilters = computed(() => Object.keys(filterOptions.value).length > 0)
  const hasDraftFilters = computed(() => !!keyword.value || Object.keys(tempFilterOptions.value).length > 0)

  function getFieldLabel(field: keyof T | undefined) {
    if (!field) return t('tableHeader.sortBy')
    const labelKey = props.customLabels[field]
    if (labelKey) return t(labelKey)
    const key = String(field)
    const translated = t(key)
    return translated === key ? formatSearchableLabel(key) : translated
  }

  function itemMatches(item: T, filters: Partial<Record<keyof T, any>>, keywordValue: string) {
    const filterEntries = Object.entries(filters)
    if (filterEntries.length > 0) {
      const matchesFilters = filterEntries.every(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return true
        const itemValue = item[key as keyof T]
        if (typeof value === 'boolean') return itemValue === value
        if (typeof value === 'string') return String(itemValue).toLowerCase().includes(value.toLowerCase())
        if (Array.isArray(value)) return value.includes(itemValue)
        return true
      })
      if (!matchesFilters) return false
    }

    if (!keywordValue.trim()) return true
    const keywords = keywordValue.trim().split(/\s+/).filter(Boolean)
    const keysToSearch = props.searchKeys.length > 0 ? props.searchKeys : (Object.keys(item) as (keyof T)[])
    return keywords.some((term) => {
      const searchTerm = term.toLowerCase()
      return keysToSearch.some((key) => {
        const value = item[key]
        return typeof value === 'string' && value.toLowerCase().includes(searchTerm)
      })
    })
  }

  function sortItems(items: T[]) {
    const field = sortBy.value
    const dir = sortOrder.value === 'desc' ? -1 : 1
    return [...items].sort((a: any, b: any) => {
      const aDim = !!a.__dim
      const bDim = !!b.__dim
      if (aDim !== bDim) return aDim ? 1 : -1
      if (!field) return 0
      return compareValues(a[field], b[field]) * dir
    })
  }

  const filteredList = computed(() => {
    const list = props.data || []
    const keywordValue = keyword.value
    if (!hasDraftFilters.value && !hasAppliedFilters.value) return sortItems(list)

    if (isFilterStage.value) {
      return sortItems(
        list.map((item) => ({
          ...item,
          __dim: !itemMatches(item, tempFilterOptions.value, keywordValue)
        }))
      )
    }

    return sortItems(list.filter((item) => itemMatches(item, filterOptions.value, keywordValue)))
  })

  const finalSchema = computed(() => {
    if (props.schema) return props.schema
    if (!props.zodSchema?.shape) return [] as SearchableFilterSchema<T>[]

    const filters: SearchableFilterSchema<T>[] = []
    for (const [key, zodType] of Object.entries(props.zodSchema.shape)) {
      if (props.excludeKeys.includes(key as keyof T) || isSystemField(key)) continue
      const typeName = (zodType as any)._def?.typeName
      const label = getFieldLabel(key as keyof T)
      if (typeName === 'ZodBoolean') {
        filters.push({ key: key as keyof T, label, type: 'boolean' })
      } else if (typeName === 'ZodEnum') {
        const enumValues = (zodType as any)._def?.values || []
        filters.push({
          key: key as keyof T,
          label,
          type: 'select',
          options: enumValues.map((val: string) => ({ label: formatSearchableLabel(val), value: val })),
          placeholder: `Select ${label.toLowerCase()}`
        })
      }
    }
    return filters
  })

  const sortableFields = computed(() => {
    if (props.searchKeys.length > 0) return props.searchKeys
    const firstItem = props.data?.[0]
    if (!firstItem) return [] as (keyof T)[]
    return (Object.keys(firstItem) as (keyof T)[]).filter((key) => {
      const keyName = String(key)
      if (isSystemField(keyName) || props.excludeKeys.includes(key)) return false
      const value = firstItem[key]
      return typeof value === 'string' || typeof value === 'number' || (value != null && typeof (value as any).getTime === 'function')
    })
  })

  function emitSortChange() {
    emit('sortChange', { sortBy: sortBy.value, sortOrder: sortOrder.value })
  }

  function handleSortChange(field: keyof T) {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
    sortPopover.value?.close()
    emitSortChange()
  }

  function handleToggleSortOrder() {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    emitSortChange()
  }

  function handleSortClick(event: MouseEvent) {
    event.stopPropagation()
    sortPopover.value?.open(event.currentTarget)
  }

  function handleFilterChange(key: keyof T, value: any) {
    isFilterStage.value = true
    tempFilterOptions.value = { ...tempFilterOptions.value, [key]: value }
  }

  function handleKeywordInput() {
    isFilterStage.value = true
  }

  function handleConfirm() {
    filterOptions.value = { ...tempFilterOptions.value }
    isFilterStage.value = false
    const matchingItems = filteredList.value.filter((item: any) => !item.__dim)
    if (matchingItems.length === 1) emit('selected', matchingItems[0])
  }

  function resetFilters() {
    keyword.value = ''
    filterOptions.value = {}
    tempFilterOptions.value = {}
    isFilterStage.value = false
  }

  function handleEscapeKey() {
    if (isFilterStage.value) {
      tempFilterOptions.value = { ...filterOptions.value }
      isFilterStage.value = false
      return
    }
    if (keyword.value || hasAppliedFilters.value) resetFilters()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') handleConfirm()
    else if (event.key === 'Escape') handleEscapeKey()
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    const activeElement = document.activeElement as HTMLElement | null
    const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.isContentEditable
    if (!isTyping) handleEscapeKey()
  }

  watch(filteredList, (items) => emit('filtered', items), { immediate: true })

  watch(hasDraftFilters, (hasDraft) => {
    if (!hasDraft) {
      isFilterStage.value = false
      filterOptions.value = {}
    }
  })

  watch(
    () => [sortBy.value, sortOrder.value, keyword.value, isFilterStage.value] as const,
    async () => {
      if (!onSearchParamsChange) return
      await onSearchParamsChange({
        keyword: keyword.value,
        filters: isFilterStage.value ? tempFilterOptions.value : filterOptions.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        isFilterStage: isFilterStage.value
      })
    }
  )

  onMounted(() => document.addEventListener('keydown', handleGlobalKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleGlobalKeydown))

  return {
    sortPopover,
    keyword,
    filterOptions,
    tempFilterOptions,
    isFilterStage,
    sortBy,
    sortOrder,
    hasAppliedFilters,
    filteredList,
    finalSchema,
    sortableFields,
    getFieldLabel,
    handleSortChange,
    handleToggleSortOrder,
    handleSortClick,
    handleFilterChange,
    handleKeywordInput,
    handleConfirm,
    handleEscapeKey,
    handleKeydown,
    resetFilters
  }
}
