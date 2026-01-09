<script lang="ts" setup>
import { MenuRouterKey } from '#imports'
import { clientApi } from 'api'

const { userTaskId, processKey, versionId } = defineProps<{
  userTaskId: string,
  processKey: string,
  versionId: string,
}>()
defineOptions({
  name: 'WorkflowStartFullPageDead'
})

const loading = ref(false)
const vFormRef = ref()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
function formDataGet(propList: any = []) {
  return propList.reduce((prev: any, item: any) => {
    if (item.value) prev[item.id] = item.value
    return prev
  }, {})
}

async function formJsonGet(userTaskId: string, processKey: string, versionId: string) {
  const response: any = await clientApi.api.getDmsFormPropertiesQuery({
    userTaskId,
    processKey,
    versionId
  }).then(res => res.data)
  if (!response[0] ||
    response[0] && !response[0].jsonValue) return {}
  return JSON.parse(response[0].jsonValue)
}

async function init() {
  const props = await clientApi.api.postWorkflowProperties({ processKey }).then(res => res.data)
  const formData = formDataGet(props)
  const formJson = await formJsonGet('start', processKey, versionId)
  const xml = await clientApi.api.getWorkflowVersionVersionidBpmnxml(versionId)
  handleAdditionalSetting(xml, {}, formData)

  nextTick(() => {
    vFormRef.value.setForm(formJson, formData, props)
  })
}

type AdditionalButton = {
  props: any,
  component: string,
}
const additionalButton = ref<AdditionalButton[]>([])
const additionalButtonRef = ref<any[]>([])
const pageButtonSetting = ref<any>(null)
async function handleAdditionalSetting(xml: any, taskDetail: any, formData: any) {
  const { buttons, components, buttonSetting } = await getBpmnAdditionalElement(xml, userTaskId, taskDetail, formData)
  additionalButton.value = buttons
  if(buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

async function handleSubmit() {
  try {
    loading.value = true
    let data = await vFormRef.value.getFormData(true, false)
    if (!data) throw new Error(`${t('incompleteData')}`)

    // check additional button 
    // if additional button has expose "beforeSubmit" method, call it
    const additionButtonActions: any = []
    additionalButtonRef.value.forEach(item => {
      if (item && item.beforeSubmit) {
        additionButtonActions.push(item.beforeSubmit())
      }
    })
    const buttonResults = await Promise.all(additionButtonActions)
    console.log('additionButtonActions', buttonResults)
    // after check all actions, if any addtional data need to set to from data, set it
    buttonResults.forEach((item: any) => {
      if (item && typeof item === 'object') {
        data = { ...data, ...item }
      }
    })
    // end addtional button actions
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'object') {
        data[key] = JSON.stringify(data[key])
      }
    })

    const form = {
      processKey,
      businessKey: data.businessKey || '',
      properties: Object.entries(data).reduce((newObj, [key, val]) => {
        if (val || val === false || val == '0') newObj[key] = val
        return newObj
      }, {})
    }
    console.log('form', form)
    await clientApi.api.postWorkflowProcessStart(form).then(res => res.data)

    routerProvider?.message.success('Workflow created')
    cancel()
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

async function addtionalSubmit(formData: any) {
  const form = {
    processKey,
    businessKey: formData.businessKey || '',
    properties: Object.entries(formData).reduce((newObj, [key, val]) => {
      if (val || val === false || val == '0') newObj[key] = val
      return newObj
    }, {})
  }
  await clientApi.api.postWorkflowProcessStart(form).then(res => res.data)

  routerProvider?.message.success('Workflow created')
  cancel()
}


function cancel() {
  const fallbackPageItem = {
    id: 'client-workflow',
    name: 'client-workflow',
    icon: 'dp-icon:flow-outline',
    hoverIcon: 'dp-icon:flow-outline',
    label: 'menus_workflow',
    component: 'LazyWorkflowPage',
    props: {
      workflowType: 'myTask'
    }
  }
  routerProvider?.back(fallbackPageItem)
}

onMounted(() => {
  init()
})
</script>


<template>
  <div class="pageContainer">
    <WorkflowDetailFormRender ref="vFormRef">
      <template #action>
        <div class="workflow-actions">
          <template v-for="(item,index) in additionalButton" :key="index">
            <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="addtionalSubmit" />
          </template>
          <el-button id="Workflow__NewWorkflow__StartFullPageDead__Cancel" @click="cancel">
            {{ $t('cancelText') }}
          </el-button>
          <el-button
            v-if="!pageButtonSetting || pageButtonSetting.showSumBitButton"
            id="Workflow__NewWorkflow__StartFullPageDead__Submit" type="primary"
            :disabled="loading" @click="handleSubmit">
            <template v-if="pageButtonSetting && pageButtonSetting.submitButtonLabel">
              {{ pageButtonSetting.submitButtonLabel }}
            </template>
            <template v-else>
              {{ $t('common_submit') }}
            </template>
          </el-button>
        </div>
      </template>
    </WorkflowDetailFormRender>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  padding: var(--app-space-s);
  position: relative;
}

.workflow-actions {
  box-shadow: var(--el-box-shadow-light);
  padding: var(--app-space-s);
  text-align: right;
}
</style>
