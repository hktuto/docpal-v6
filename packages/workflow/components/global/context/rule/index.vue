<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const editorProvider = inject(WORKFLOW_EDITOR_PROVIDER)
const graphProvider = inject(WORKFLOW_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph / editorProvider provider not found')
}
const { bpmnGlobalRules, setBpmnRules, deleteBpmnRule } = editorProvider.variables
const FormDialogRef = ref()

function handleAdd() {
  FormDialogRef.value?.handleOpen()
}

function handleEdit(row: any) {
  FormDialogRef.value?.handleOpen({
    ...row,
    ...row.validationRule
  })
}

async function handleRemove(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete', { tip: t('bpmn.globalRuleTip') + '，' })}`)
    if (action !== 'confirm') return
    const nodes = graphProvider?.graph.value?.getNodes()
    await deleteBpmnRule(row, nodes)
    graphProvider?.graph.value?.cleanHistory()
  } catch (error) {
    console.error(error)
  }
}

async function ruleAdd(newField: any) {
  await setBpmnRules(newField)
  graphProvider?.graph.value?.cleanHistory()
}

async function ruleChange(newField: any) {
  const nodes = graphProvider?.graph.value?.getNodes()
  await setBpmnRules(newField, nodes)
  graphProvider?.graph.value?.cleanHistory()
}

onMounted(() => {
  if (bpmnGlobalRules.value.length > 0) {
    const find = bpmnGlobalRules.value.find((item: any) => item.id === 'user_creator_id')
    if (!find) {
      ruleAdd({
        id: 'user_creator_id',
        name: 'Creator',
        type: 'text',
        maxLength: 200
      })
    }
  }
})
</script>
<template>
  <div>
    <h4>
      {{ $t('bpmn.globalRules') }}
      <Icon name="lucide:plus" @click="handleAdd" />
    </h4>
    <div v-for="(item, index) in bpmnGlobalRules" :key="item.id" class="formFieldItem">
      <div class="label" @click="handleEdit(item)">
        {{ item.name }}
      </div>
      <div class="actions">
        <Icon name="lucide:square-pen" @click="handleEdit(item)" />
      </div>
      <div class="actions">
        <Icon name="lucide:delete" @click="handleRemove(item)" />
      </div>
    </div>
    <ContextRuleDialog ref="FormDialogRef" mode="global" @created="ruleAdd" @updated="ruleChange" />
  </div>
</template>
<style lang="scss" scoped>
.formFieldItem {
  display: grid;
  grid-template-columns: 1fr min-content min-content;
  justify-content: space-between;
  align-items: center;
  padding-block: var(--app-space-s);
  gap: calc(var(--app-space-s) / 2);
  font-size: var(--app-font-size-m);
  transition: all 0.2s ease-in-out;
}

.formFieldItem + .formFieldItem {
  border-top: 1px solid var(--app-grey-900);
}

.iconify {
  cursor: pointer;
}
</style>
