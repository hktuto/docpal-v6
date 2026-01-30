<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['created'])

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const workflowTemplateList = [
  {
    id: 'Blank',
    name: 'Blank',
    icon: '/icons/workflow/singleStepIcon.svg',
    tip: 'blankStepTip',
    url: '/bpmn/blank.xml'
  },
  {
    id: 'Single',
    name: 'Single Approval',
    icon: '/icons/workflow/multipleStepIcon.svg',
    tip: 'blankStepTip',
    url: '/bpmn/single.xml'
  }
]

const state = reactive({
  visible: false,
  loading: false,
  form: {
    template: 'Blank',
    name: ''
  }
})
const formRef = ref()

async function handleSubmit() {
  // TODO : validate form
  try {
    await formRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }
  // router.push(`/workflowEditor/new?template=${state.form.template}&name=${state.form.name}`)
  const text = await getXMLFileTemplate(state.form.template)
  let name = state.form.name
  const timestamp = new Date().getTime()
  const nameToId = name.toLowerCase().replaceAll(' ', '_') + '_' + timestamp
  const bpmnFile = text.replaceAll('workflowId', nameToId).replaceAll('workflowName', state.form.name)
  // convert to blob
  const blob = new Blob([bpmnFile], { type: 'text/xml;charset=utf-8' })
  const form: any = new FormData()
  form.append('name', name)
  form.append('attr_id', nameToId)
  form.append('versionId', 'V1')
  form.append('jsonValue', JSON.stringify({}))
  form.append('file', blob, 'workflow.bpmn.xml')
  form.append('isDraft', true)
  try {
    const data = await clientApi.admin.postAdmindocpalWorkflowProcessDefinitionUpload({ requestDTO: {} }, form).then((res) => res.data)
    state.form = {
      template: 'Blank',
      name: ''
    }
    ElMessage.success(t('tip_createdMsg', { modelName: t('dashboard.WorkflowNewCount'), name: null }))

    if (!data || !data?.latestVersionId || !data?.draftId) {
      state.visible = false
      emits('created', data)
      return
    }

    // update field
    const params: any = {
      versionDraftId: data?.latestVersionId,
      version: '1',
      nodeName: 'global',
      draftId: data?.draftId,
      validationRules: [
        {
          id: 'user_creator_id',
          name: 'Creator',
          validationRule: {
            'type': 'text',
            'maxLength': 200
          }
        }
      ]
    }
    await clientApi.admin.postAdmindocpalValidationRules(params).then(r => r.data)

    state.visible = false
    emits('created', data)
  } catch (e) {
    console.log(e)
  }
}

async function getXMLFileTemplate(template: string = 'Single') {
  const item: any = workflowTemplateList.find((item) => item.id === template)
  const templatePath = item.url
  const response = await fetch(templatePath)
  return (await response.text()) as string
}

function handleOpen(setting: any) {
  state.visible = true
  state.loading = false
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('workflow_editorCreate')" :close-on-click-modal="false"
             distroy-on-close>
    <el-form ref="formRef" :model="state.form" label-position="top" class="demo-ruleForm" status-icon>
      <el-form-item
        :label="$t('workflowEditor.name')"
        prop="name"
        :rules="{
          required: true,
          message: $t('workflowEditor.name') + $t('render.hint.fieldRequired'),
          trigger: 'blur'
        }"
      >
        <el-input v-model="state.form.name" :placeholder="$t('workflowEditor.name')" clearable />
      </el-form-item>
      <el-form-item :label="$t('workflowEditor.template')" prop="template">
        <el-radio-group v-model="state.form.template">
          <el-radio v-for="item in workflowTemplateList" :key="item.id" :label="item.id">
            <div class="workflow-template-step">
              <SvgIcon class="workflow-template-step-icon" :src="item.icon" />
              <h3 class="workflow-template-step-label">{{ item.name }}</h3>
              <!-- <tip class="workflow-template-step-tip">{{$t(item.tip)}}</tip> -->
            </div>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="WorkflowEditor__CreateNewWorkflow__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit"
      >{{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-radio-group) {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  font-size: 0;
  flex-direction: column;
  gap: calc(var(--app-space-xs) * 2);
}

.el-radio {
  height: unset;
}

.workflow-template-step {
  display: grid;
  grid-template-columns: min-content 1fr;
  grid-column-gap: var(--app-space-xs);
}
</style>
