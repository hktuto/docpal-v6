import type { InjectionKey, Ref } from 'vue'

export const RecordDashboardContextKey: InjectionKey<{
  record: Ref<Record<string, any>>
  tableId: Ref<string>
  tableFields: Ref<any[]>
}> = Symbol('RecordDashboardContext')
