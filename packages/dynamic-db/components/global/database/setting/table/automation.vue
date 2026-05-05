<script setup lang="ts">
const props = defineProps<{
  id: string
  menuItem: any
  activeSubSection: string
}>()

const masterTableId = computed(() => props.menuItem.item_type === 'view' ? props.menuItem.metadata.tableId :  props.menuItem?.item_id as string | undefined)
</script>

<template>
  <div v-if="masterTableId" class="table-automation-wrapper">
    <DatabaseSettingAutomation :master-table-id="masterTableId" />
  </div>
  <el-empty v-else description="No table selected" />
</template>

<style lang="scss" scoped>
.table-automation-wrapper {
  height: 100%;
}
</style>
