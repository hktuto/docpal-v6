/**
 * Detail View Widgets
 * 
 * Phase 1 widgets for record detail view:
 * - TableInfo: Display selected fields from the current record
 * - RelatedTableList: Show related records for a relation field
 */

export { default as TableInfo } from './TableInfo.vue'
export { default as TableInfoSetting } from './TableInfoSetting.vue'
export { default as RelatedTableList } from './RelatedTableList.vue'
export { default as RelatedTableListSetting } from './RelatedTableListSetting.vue'

// Widget component map for dynamic rendering
export const detailWidgetComponents = {
  TableInfo: () => import('./TableInfo.vue'),
  RelatedTableList: () => import('./RelatedTableList.vue')
}
