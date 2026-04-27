<script lang="ts" setup>
import { getButtonAdditionalElement, MenuRouterKey } from '#imports'
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

const { definition_id, metadata } = defineProps<{
  definition_id: string
  metadata: any
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
  const formKey = metadata.formKey
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

    await handleAdditionalSetting(metadata)

    nextTick(() => {
      vFormRef.value.setForm(formJson.jsonValue)
    })
  } catch (e) {
    console.log(e)
  }
}

const pageButtonSetting = ref<any>()
async function handleAdditionalSetting(metadata: any) {
  const { buttons, buttonSetting, signatureSetting } = await getButtonAdditionalElement([], metadata, {})
  if (buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

async function handleSubmit() {
  try {
    loading.value = true
    let formData = await vFormRef.value.getFormData(true, false)
    if (!formData) throw new Error(`${t('incompleteData')}`)

    const formParams = {
      start_user_id: userId.value,
      definition_id: definition_id,
      variables: {
        ...formData,
        __system__user_creator_id: userId.value
      }
    }

    console.log(12,formParams)
    return
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

async function additionalSubmit() {
  let formData = await vFormRef.value.getFormData(true, false)
  if (!formData) throw new Error(`${t('incompleteData')}`)

  const formParams = {
    start_user_id: userId.value,
    definition_id: definition_id,
    variables: {
      ...formData,
      __system__user_creator_id: userId.value
    }
  }
  const data = await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data)
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
          <!--          <template v-for="(item, index) in additionalButton" :key="index">-->
          <!--            <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="additionalSubmit" />-->
          <!--          </template>-->
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
