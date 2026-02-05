<script lang="ts" setup>
import type { VxeGridProps } from 'vxe-table'
import { ElMessageBox } from 'element-plus'
const { t } = useI18n()

const { fields } = defineProps<{
  fields: any[] // workflowTask 的 field 列表（局部）
}>()
const opened = ref(false)
const FormDialogRef = ref()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
const { bpmnGlobalRules, deleteBpmnRule, setBpmnRules } = editorProvider.BpmnRule

if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['change', 'rule-add', 'update-rule', 'delete-rule'])

function open() {
  opened.value = true
}

function openNewFieldDialog() {
  if (!FormDialogRef.value || !FormDialogRef.value.handleOpen) {
    throw createError('new field ref not found')
  }
  FormDialogRef.value?.handleOpen()
}

const selectedField = computed(() => {
  return fields.map((item) => item.attr_id)
})

function taskAddField(value: string[]) {
  if (value.length === 0) {
    return emits('change', [])
  }
  const position = value.length - 1
  const index = bpmnGlobalRules.value.findIndex((item: any) => item.id === value[position])
  if (index === -1) {
    FormDialogRef.value?.handleOpen({ name: value[position], id: value[position] })
  } else {
    const newFields = bpmnGlobalRules.value.filter((item: any) => value.includes(item.id))
    emits('change', newFields)
  }
}
function taskRuleAdd(value: any) {
  emits('rule-add', value, () => {
    reload()
  })
}
async function taskRuleChange(value: any) {
  const nodes = graphProvider?.graph.value?.getNodes()
  await setBpmnRules(value, nodes)
  emits('update-rule', value)
  reload()
}

function handleDblclick(row: any) {
  FormDialogRef.value?.handleOpen({ ...row, ...row.validationRule })
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'workflowEditorFieldMappingSetting',
  zoom: false,
  virtualScroll: true,
  api: (pageParams: any) => {
    console.log('api', bpmnGlobalRules.value)
    return Promise.resolve([...bpmnGlobalRules.value])
  },
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'validationRule.type' }
  ],

  dblClickAction: ({ row, column, event }: any) => {
    console.log('dblClickAction', row, column, event)
    // handleDblclick(row)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: 'common_delete',
        action: async ({ row }) => {
          const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete', { tip: t('bpmn.globalRuleTip') + '，' })}`).catch(action => action)
          if (action !== 'confirm') return
          const nodes = graphProvider?.graph.value?.getNodes()
          await deleteBpmnRule(row, nodes)
          emits('delete-rule', row.id)
          reload()
        }
      }
    ]
  ],
  optionalConfig:{
    rowConfig:{
      keyField: 'id'
    }
  },
  saveColumnOrder: false
})
watch(
  () => fields,
  () => {
    reload()
  },
  {
    deep: true
  }
)

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="opened" width="80%" draggable append-to-body class="big">
    <template #header> <span style="font-size: var(--app-font-size-m);font-weight: bold;">Edit Field </span></template>
    <template #default>
      <div class="selecteAndCreateContainer">
        <ElSelect v-model="selectedField" multiple allow-create filterable default-first-option @change="taskAddField">
          <ElOption v-for="item in bpmnGlobalRules" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
        <ElButton id="Workflow__EditField__AddField" type="primary" @click="openNewFieldDialog">Add Field</ElButton>
      </div>
      <ElDivider />
      <el-alert show-icon :title="$t('bpmn.globalRuleTip')" type="info" />
      <div class="tableSection">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <div>{{ $t('bpmn.globalRules') }}</div>
          </template>
        </VxeGrid>
      </div>
    </template>
  </ElDialog>
  <BpmnRuleFormDialog ref="FormDialogRef" @created="taskRuleAdd" @updated="taskRuleChange" />
</template>

<style lang="scss" scoped>
.selecteAndCreateContainer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
.tableSection {
  height: 60vh;
}
</style>
