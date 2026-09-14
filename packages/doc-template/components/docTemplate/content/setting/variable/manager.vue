<script setup lang="ts">
import { type DocTemplateVariable } from '../../../../../utils/docTemplateHelper'

const docTemplateCtx = inject(DocTemplateProveKey)
if (!docTemplateCtx) {
  throw new Error('DocTemplateContext not found')
}

const variableFormRef = ref()

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'DocumentTemplateVariableManage',
  zoom: false,
  virtualScroll: true,
  api: () => {
    return docTemplateCtx.variables.value
  },
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'type' },
    { title: 'Display Value', field: 'value' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleEdit(row)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }) => {
          handleEdit(row)
        }
      },
      {
        code: 'delete',
        name: 'common_delete',
        action: ({ row }) => {
          handleDelete(row)
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }: { row: any; code?: string }) => {
    if (!row) {
      return { visible: false, disabled: false }
    }

    if (code === 'edit') {
      return {
        visible: true,
        disabled: false
      }
    }

    if (code === 'delete') {
      return {
        visible: !editorUse(row.id),
        disabled: false
      }
    }

    return {
      visible: false,
      disabled: true
    }
  },
  optionalConfig: {
    rowConfig: {
      keyField: 'id'
    }
  },
  saveColumnOrder: false
})

function handleOpenCreate() {
  variableFormRef.value.open()
}

function handleEdit(variable: DocTemplateVariable) {
  variableFormRef.value.open(variable)
}

function handleDelete(variable: DocTemplateVariable) {
  if ('inUse' in variable && variable.inUse) return
  docTemplateCtx?.removeVariable?.({ ...variable })
  reload()
}

function handleFormSubmit(variable: DocTemplateVariable) {
  docTemplateCtx?.addVariable?.({ ...variable })
  reload()
}

function handleUpdate(variable: DocTemplateVariable) {
  docTemplateCtx?.updateVariable?.({ ...variable })
  reload()
}

function editorUse(id: string) {
  if (!id) return false
  let editorJson = docTemplateCtx?.editor.value.getJSON()
  if (!editorJson) return false
  // Check if the id exists
  return checkIdIsExists(editorJson, id)
}

function checkIdIsExists(item: any, id: string) {
  try {
    const st = JSON.stringify(item)
    return st.includes(id)
  } catch (e) {
    return false
  }
}
</script>

<template>
  <div class="tableSection">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-button type="primary" @click="handleOpenCreate">New Variable</el-button>
      </template>
    </VxeGrid>
  </div>

  <DocTemplateContentSettingVariableForm ref="variableFormRef" @submit="handleFormSubmit" @update="handleUpdate" />
</template>

<style lang="scss" scoped>
.tableSection {
  height: 60vh;
}
</style>
