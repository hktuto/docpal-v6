<script setup lang="ts">
const { formField } = defineProps<{
  formField: any[]
}>()
const { getVariablesByDisplayTypes } = useVariablesProvide()
const emits = defineEmits(['update'])
const visible = ref(false)
const formFieldDetailDialog = ref()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'WorkflowVariableManage',
  zoom: false,
  virtualScroll: true,
  api: () => {
    return formField
  },
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'tag' }
  ],
  dblClickAction: ({ row, column, event }: any) => {},
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }) => {
          handleDblclick(row)
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }: { row: any; code?: string }) => {},
  optionalConfig: {
    rowConfig: {
      keyField: 'id'
    }
  },
  saveColumnOrder: false
})

function open() {
  visible.value = true
  getVariablesByDisplayTypes()
}

function handleDblclick(row: any) {
  formFieldDetailDialog.value.open(row)
}

function updateFormField(field: any) {
  emits('updateFormField', field)
  reload()
}

watch(
  () => formField,
  () => {
    reload()
  },
  {
    immediate: true,
    deep: true
  }
)

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Field Manage" append-to-body class="big">
    <div class="tableSection">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" />
    </div>
  </el-dialog>

  <LazyContextFormFieldDetailDialog ref="formFieldDetailDialog" @update="updateFormField" />
</template>

<style scoped lang="scss">
.tableSection {
  height: 60vh;
}
</style>
