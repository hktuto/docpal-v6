<script lang="ts" setup>
import { conversionFormDataByVariables, MenuRouterKey } from '#imports'
import { newClientApi, clientApi } from 'api'

const { definition_id, taskNode } = defineProps<{
  definition_id: string
  taskNode: any
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
  const formKey = taskNode.config.initialise.form_key
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
      vFormRef.value.setForm(formJson.jsonValue)
    })
  } catch (e) {
    console.log(e)
  }
}

async function handleSubmit() {
  try {
    loading.value = true
    let formData = await vFormRef.value.getFormData(true, false)
    if (!formData) throw new Error(`${t('incompleteData')}`)

    const cFormData = conversionFormDataByVariables(formData, taskNode.config.initialise.form_fields)

    const formParams = {
      start_user_id: userId.value,
      definition_id: definition_id,
      variables: {
        ...cFormData,
        __system__user_creator_id: userId.value
      }
    }

    const data = await clientApi.instance.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data.data)

    setTimeout(async () => {
      // Check workflow running status
      const newVar = await clientApi.instance.get(`/oniflow/api/v1/processes/instance/${data.id}`).then((r: any) => r.data.data)
      if (newVar.state === 'running') {
        routerProvider?.message.success('Workflow created')
      }
    }, 100)
    cancel()
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
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
          <el-button id="Workflow__NewWorkflow__StartFullPageDead__Cancel" @click="cancel">
            {{ $t('cancelText') }}
          </el-button>
          <el-button id="Workflow__NewWorkflow__StartFullPageDead__Submit" type="primary" :disabled="loading" @click="handleSubmit">
            {{ $t('common_submit') }}
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
