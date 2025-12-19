<script setup lang="ts">
import type { Node } from '@antv/x6'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule
const formRef = ref()
const rules = reactive({
  userField: [{
    required: true,
    message: t('render.hint.fieldRequired', { name: t('userField') }),
    trigger: 'change'
  }]
})
const levelList = ref([
  { label: 'Primary', value: 'primary' },
  { label: 'Success', value: 'success' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' }])

/**
 * Calendar => JSON String {"title":"","data":""}
 * Case DashBoard => JSON String { "instanceId":"","versionId":"" }
 */
const typeList = ref([
  { label: 'Calendar Event', value: 'calendar' },
  { label: 'Case Dashboard Event', value: 'caseDashboard' },
  { label: 'Common Event', value: 'common' }
])

const state = reactive({
  userField: '',
  message: '',
  messageObject: {
    templateId: 'notification.workflow.custom',
    level: 'success',
    eventType: 'common',
    additionalContent: '',
    showNotification: true,
    notiStatus: 'SUCCESS'
  }
})

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

async function initForm() {
  const fields: any = node.data.data.extensionElements['flowable:field']

  if (fields && fields.lenght < 1) {
    return
  }
  fields.forEach((item: any) => {
    switch (item.attr_name) {
      case 'notificationUserFromVariables':
        state.userField = item['flowable:expression'].__cdata
        break
      case 'system_notification_message':
        state.message = item['flowable:string'].__cdata
        break
    }
  })
  if (!state.message || '' == state.message) return

  // message Field to Level and Type and Content
  const messageObj = JSON.parse(state.message)
  state.messageObject.level = messageObj.level
  state.messageObject.eventType = messageObj.eventType
  state.messageObject.additionalContent = messageObj.additionalContent
}

function fieldMappingUpdate(newVal: any | string, name: string) {
  graphProvider?.graph.value?.startBatch('update-send-notification-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === name)
  if ('notificationUserFromVariables' === name) {
    newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal || ''
  } else if ('system_notification_message' === name) {
    newData.data.extensionElements['flowable:field'][index]['flowable:string'].__cdata = newVal || ''
  }

  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-send-notification-data')
}

function handelMessageObject() {
  state.message = JSON.stringify(state.messageObject)
  fieldMappingUpdate(state.message, 'system_notification_message')
}

watch(() => node, async () => {
  if (node && node.data) {
    console.log(node, node.data)
    await initForm()
  }
}, {
  immediate: true,
  deep: true
})
</script>

<template>
  <div>
    <BpmnSidebarEditLabel :node="node" />
    <el-form ref="formRef" label-width="auto" :model="state" label-position="top" :rules="rules"
             :disabled="editorProvider.readonly.value">
      <el-form-item :label="t('User Field')" prop="userField">
        <el-select v-model="state.userField" :placeholder="t('common_selectOccupancyContent')" filterable
                   @change="(val:any) => fieldMappingUpdate(val, 'notificationUserFromVariables')">
          <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('Message Level')">
        <el-select v-model="state.messageObject.level" @change="handelMessageObject">
          <el-option v-for="item in levelList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('Event Type')">
        <el-select v-model="state.messageObject.eventType" @change="handelMessageObject">
          <el-option v-for="item in typeList" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('Message Content')">
        <el-select v-model="state.messageObject.additionalContent" @change="handelMessageObject" filterable>
          <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">

</style>