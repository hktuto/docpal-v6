import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { newClientApi } from 'api'
import type { ResultCfUserTableConfigResponseDTO } from 'api/src/generate/newClient'

type RelationConfig = {
  setRelationConfig: (config: any) => void
  getRelationFieldConfig: (tableId: string, fieldId: string) => any
}
export const RelationConfigKey: InjectionKey<RelationConfig> = Symbol('RelationConfigKey')
export function useRelationConfig() {
  const relationConfig = ref<any>({})
  const setRelationConfig = async (tableFields: any) => {
    relationConfig.value = {}
    const relationFields = tableFields.filter((field: any) => field.business_type === ColumnFieldType.Relation)
    relationFields.forEach(async (field: any) => {
      const data: ResultCfUserTableConfigResponseDTO = await newClientApi.getDocpalMasterTableUserConfig({
        tableId: field.display_structure.relation_table_id,
        userId: 'master'
      })
      relationConfig.value[field.display_structure.relation_table_id] = data?.data?.tableFields
    })
  }
  function getRelationFieldConfig(tableId: string, fieldId: string) {
    const field = relationConfig.value[tableId]?.find((field: any) => field.id === fieldId)
    return field ? {
      ...field.display_structure,
      business_type: field.business_type,
      id: field.id,
      field_name: field.field_name,
      field_name_alias: field.field_name_alias,
    } : null
  }
  provide(RelationConfigKey, { setRelationConfig, getRelationFieldConfig })
  return {
    setRelationConfig,
    getRelationFieldConfig
  }
}
export function useRelationConfigInject(): RelationConfig {
  const context = inject(RelationConfigKey)
  if (!context) {
    throw new Error('RelationConfig not found. Make sure useRelationConfig is called in a parent component.')
  }
  return context
}
