<script lang="ts" setup>
import { clientApi } from 'api'

const { caseInstanceId, actionStepId, backItem } = defineProps<{
  caseInstanceId: string
  actionStepId: string
  backItem?: any
}>()
const routerProvider = inject(MenuRouterKey)
defineOptions({
  name: 'CaseProcessTaskStartFullPageDead'
})
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const formJson = ref()
const formData = ref()
const additionalButtonRef = ref<any[]>([])
const additionalButton = ref<any[]>([])
const vFormRef = ref()
const inParameters = ref<any>({})
const primaryForm = ref<any>([])
const loading = ref(false)
async function setUpForm() {
  try {
    loading.value = true
    // get action item detail from case instance
    const stepDetail = (await clientApi.api.postCaseDashboardInstanceActionPreRequisite({ id: actionStepId }).then((res) => res.data)) as any

    // get latest case detail
    const caseData = (await clientApi.api.getCaseDashboardInstanceCaseidPrimaryformData(caseInstanceId).then((res) => res.data)) as any
    primaryForm.value = caseData.rows
    inParameters.value = stepDetail.inParameters as { [key: string]: string }

    // get form xml
    const xml = await clientApi.api.getWorkflowVersionVersionidBpmnxml(stepDetail.processDefinitionVersionId)
    // get form data
    formData.value = Object.keys(inParameters.value).reduce((prev: any, key) => {
      const valueItem = caseData.rows.find((c) => c.id === key)
      if (valueItem && valueItem.value) {
        prev[inParameters.value[key]] = valueItem.value
      }
      return prev
    }, {})
    console.log('inParameters', inParameters.value, stepDetail, caseData.rows, formData.value)
    // set case info into form data
    formData.value.caseInstanceId = caseInstanceId
    formData.value.case_id = caseInstanceId

    // get form json with lateset versiion
    formJson.value = await clientApi.api.getDmsFormPropertiesQuery({
        userTaskId: 'start',
        processKey: stepDetail.processDefinitionKey,
        versionId: stepDetail.processDefinitionVersionId
      })
      .then((res: any) => {
        return res.data.length > 0 ? (res.data[0].jsonValue ? JSON.parse(res.data[0].jsonValue) : {}) : {}
      })
    // get additional element
    const { buttons, components } = await getBpmnAdditionalElement(xml, 'Start', stepDetail, formJson.value)
    additionalButton.value = buttons
    nextTick(() => {
      console.log('set form data', formData.value)
      vFormRef.value.setForm(formJson.value, formData.value, [], xml)
    })
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

function handelCancel() {
  routerProvider?.back(backItem)
}

function formKeyToCaseKey(formKey: string) {
  const item = Object.keys(inParameters.value).find((key) => inParameters.value[key] === formKey)
  return item
}

async function handleSubmit() {
  try {
    loading.value = true
    const data = await vFormRef.value.getFormData(true, false)
    let variables = Object.keys(inParameters.value).reduce((prev: any, item: any) => {
      const otherKeys = inParameters.value[item]
      if (data[otherKeys]) {
        prev[item] = data[otherKeys]
      } else {
        const orginValue = primaryForm.value.find((item) => item.id === otherKeys)
        if (orginValue && orginValue.value) {
          prev[item] = orginValue.value
        }
      }
      return prev
    }, {}) as any
    if (!variables.user_creator_id) {
      variables.user_creator_id = useUserId().value
    }
    if (!data.user_creator_id) {
      data.user_creator_id = useUserId().value
    }
    const additionButtonActions: any = []
    additionalButtonRef.value.forEach((item) => {
      if (item && item.beforeSubmit) {
        additionButtonActions.push(item.beforeSubmit())
      }
    })
    const buttonResults = await Promise.all(additionButtonActions)
    // after check all actions, if any addtional data need to set to from data, set it
    buttonResults.forEach((item: any) => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach((updateKey) => {
          // find key in inParameters
          const otherKeys = formKeyToCaseKey(updateKey)
          if (otherKeys) {
            variables[otherKeys] = item[updateKey]
          }
        })
      }
    })
    // end addtional button actions
    Object.keys(variables).forEach((key) => {
      if (typeof variables[key] === 'object') {
        variables[key] = JSON.stringify(variables[key])
      }
    })

    await clientApi.api.postCaseInstanceProcessStart({
      id: actionStepId,
      workflowVariables: data,
      variables
    })
    handelCancel()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function additionSubmit(formData: any) {
  const variables = Object.keys(inParameters.value).reduce((prev: any, item: any) => {
    const otherKeys = inParameters.value[item]
    prev[item] = formData[otherKeys]
    return prev
  }, {}) as any
  if (!formData.user_creator_id) {
    formData.user_creator_id = useUserId().value
  }
  const res = await clientApi.api.postCaseInstanceProcessStart({
    id: actionStepId,
    workflowVariables: formData,
    variables
  })
  handelCancel()
}

onMounted(() => {
  setUpForm()
})
</script>

<template>
  <div v-loading="loading" class="pageContianer">
    <WorkflowDetailFormRender ref="vFormRef">
      <template #action>
        <div class="workflow-detail-pane--btns">
          <template v-for="(item, index) in additionalButton" :key="index">
            <component :is="item.component" ref="additionalButtonRef" v-bind="{ ...item.props, formData }" @submit="additionSubmit" />
          </template>
          <el-button id="CaseManagement__Detail__Form_Cancel" @click="handelCancel">
            {{ $t('cancelText') }}
          </el-button>
          <el-button :loading="loading" id="CaseManagement__Detail__Form_Submit" type="primary" @click="handleSubmit">
            {{ $t('common_submit') }}
          </el-button>
        </div>
      </template>
    </WorkflowDetailFormRender>
  </div>
</template>

<style lang="scss" scoped>
.pageContianer {
  width: 100%;
  height: 100%;
  padding: var(--app-space-s);
  position: relative;
}
.workflow-detail-pane {
  display: grid;
  grid-template-rows: 1fr min-content;
  transform: scale(1);
  &--btns {
    box-shadow: var(--el-box-shadow-light);
    padding: var(--app-space-s);
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-s);
    justify-content: flex-start;
    // text-align: right;
    :deep(.el-button + .el-button){
      margin-left: 0;
    }
  }
}
</style>
