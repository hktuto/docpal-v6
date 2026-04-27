<script lang="ts" setup>
import { getButtonAdditionalElement, MenuRouterKey } from '#imports'
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

const { definition_id, formKey } = defineProps<{
  definition_id: string
  formKey: number
}>()
defineOptions({
  name: 'WorkflowStartFullPageDead'
})
const userId = useUserId()
const loading = ref(false)
const vFormRef = ref()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()

async function init() {
  if (!formKey || formKey === 0) {
    // form不存在
    routerProvider?.message.error('Form does not exist')
    cancel()
    return
  }

  try {
    const formJson = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
    if (!formJson) {
      routerProvider?.message.error('Form does not exist')
      return
    }

    nextTick(() => {
      vFormRef.value.setForm(formJson)
    })
  } catch (e) {
    console.log(e)
  }
}

const pageButtonSetting = ref<any>(null)
async function handleAdditionalSetting(metadata: any) {
  const { buttonSetting, signatureSetting } = await getButtonAdditionalElement([], metadata, {})
  if (buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

type AdditionalButton = {
  props: any
  component: string
}
const additionalButton = ref<AdditionalButton[]>([])
const additionalButtonRef = ref<any[]>([])

async function handleSubmit() {
  try {
    loading.value = true
    let formData = await vFormRef.value.getFormData(true, false)
    if (!formData) throw new Error(`${t('incompleteData')}`)

    // check additional button
    // if additional button has expose "beforeSubmit" method, call it
    const additionButtonActions: any = []
    additionalButtonRef.value.forEach((item) => {
      if (item && item.beforeSubmit) {
        additionButtonActions.push(item.beforeSubmit())
      }
    })
    const buttonResults = await Promise.all(additionButtonActions)
    console.log('additionButtonActions', buttonResults)
    // after check all actions, if any addtional data need to set to from data, set it
    buttonResults.forEach((item: any) => {
      if (item && typeof item === 'object') {
        formData = { ...formData, ...item }
      }
    })
    // end addtional button actions
    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === 'object') {
        formData[key] = JSON.stringify(formData[key])
      }
    })

    const formParams = {
      start_user_id: userId.value,
      definition_id: definition_id,
      variables: {
        ...formData,
        __system__user_creator_id: userId
      }
    }

    const data = await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data)

    setTimeout(async () => {
      // Check workflow running status
      const newVar = await $api.get(`/oniflow/api/v1/processes/instance/${data.id}`).then((r: any) => r.data)
      if (newVar.state === 'running') {
        ElMessage.success('Workflow created')
      }
    }, 100)

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
  await newClientApi.postDocpalWorkflowProcessStart(form).then((res) => res.data)
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
    <ContextFormRender ref="vFormRef">
      <template #action>
        <div class="workflow-actions">
          <template v-for="(item, index) in additionalButton" :key="index">
            <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="addtionalSubmit" />
          </template>
          <el-button id="Workflow__NewWorkflow__StartFullPageDead__Cancel" @click="cancel">
            {{ $t('cancelText') }}
          </el-button>
          <el-button
            v-if="!pageButtonSetting || pageButtonSetting.showSubmitButton"
            id="Workflow__NewWorkflow__StartFullPageDead__Submit"
            type="primary"
            :disabled="loading"
            @click="handleSubmit"
          >
            <template v-if="pageButtonSetting && pageButtonSetting.submitButtonLabel">
              {{ pageButtonSetting.submitButtonLabel }}
            </template>
            <template v-else>
              {{ $t('common_submit') }}
            </template>
          </el-button>
        </div>
      </template>
    </ContextFormRender>
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
