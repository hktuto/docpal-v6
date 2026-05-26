import { computed, type Ref } from 'vue'
import type { GanttViewConfig, GanttColumn, DateViewType } from '../types'

export interface UseGanttConfigOptions {
  columns: Ref<any[]>
  viewStyleConfig: Ref<any>
}

export function useGanttConfig(options: UseGanttConfigOptions) {
  const { columns, viewStyleConfig } = options

  const config = computed<GanttViewConfig>(() => {
    const style = viewStyleConfig.value || {}
    return {
      startField: style.startField || '',
      endField: style.endField || '',
      barLabelField: style.barLabelField || '',
      dateView: style.dateView || 'day',
      visibleColumns: style.visibleColumns || [],
      columnWidths: style.columnWidths || {}
    }
  })

  const ganttColumns = computed<GanttColumn[]>(() => {
    const all = columns.value || []
    const visibleSet = new Set(config.value.visibleColumns)
    const hasExplicitVisibility = config.value.visibleColumns.length > 0

    return all.map((col: any) => {
      const field = col.field_name
      const visible = hasExplicitVisibility ? visibleSet.has(field) : true
      const width = config.value.columnWidths[field] || 120
      return {
        field,
        title: col.field_name_alias || field,
        width,
        visible
      }
    })
  })

  const visibleColumns = computed(() => ganttColumns.value.filter(c => c.visible))

  const dateFields = computed(() => {
    return columns.value?.filter((col: any) => col.business_type?.toString() === '5') || []
  })

  const hasDateFields = computed(() => dateFields.value.length > 0)

  const startField = computed(() => config.value.startField)
  const endField = computed(() => config.value.endField)
  const barLabelField = computed(() => config.value.barLabelField)
  const dateView = computed(() => config.value.dateView)

  return {
    config,
    ganttColumns,
    visibleColumns,
    dateFields,
    hasDateFields,
    startField,
    endField,
    barLabelField,
    dateView
  }
}
