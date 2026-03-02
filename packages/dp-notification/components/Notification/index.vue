<template>
  <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" is-dot class="actionIcons">
    <SvgIcon src="/icons/notification.svg" @click="handleOpen"></SvgIcon>
  </el-badge>
  <!-- <NotificationDialog ref="NotificationDialogRef" :unreadCount="unreadCount" @unreadCountChange="handleUnreadCountChange"></NotificationDialog> -->
  <NotificationTabDialog ref="NotificationDialogRef" :unreadCount="unreadCount"
                         @unreadCountChange="handleUnreadCountChange" />
</template>

<script lang="ts" setup>
import { ElNotification } from 'element-plus'
import { newClientApi } from 'api'
import { allowFeature, caseManageDashboardPage, routeCalendarManagement } from '#imports'
import { TabManagerKey } from '#imports'

const tabProvider = inject(TabManagerKey)
const unreadCount = ref(0)
const notificationStore = ref()
const NotificationDialogRef = ref()
const { uploadState } = useUploadAIStore()
const { messageHandlers } = useNotification()
const userId = useUserId()
const failList = ['FAIL']
const { t } = useI18n()
function handleOpen() {
  NotificationDialogRef.value.handleOpen()
}

async function getUnreadCount() {
  unreadCount.value = await newClientApi.getNotificationUnreadNumber().then(r =>r.data)
}

function handleUnreadCountChange(count: number) {
  console.log('handleUnreadCountChange', count)
  if (count >= 0) unreadCount.value = count
  else getUnreadCount()
}

function messageChange(notiData) {
  console.log('messageChange', notiData)
  getUnreadCount()
  NotificationDialogRef.value.initData()
  try {
    const messageJson = notiData.messageJson
    const content = JSON.parse(messageJson.content)
    switch (messageJson.functionPoint) {
      case 'Ai-analysis_UPLOAD_FOLDER':
        handleAiUpload(content)
        break
      case 'Ai-analysis_REPLACE_FILE':
        handleReplaceFileWithAi(content)
        break
      case 'Workflow_CUSTOM':
        handleWorkflow(content)
        break
      default:
        if (messageJson.showNotification) {
          handleShowNotification(content)
          break
        }
    }
  } catch (error) {
    console.log(error)
  }
}

function handleAiUpload(content) {
  if (content.uploadId) {
    const message = content['upload status'] === 'FAIL' ? 'ai.uploadCompleteAndAIFail' : 'ai.uploadClick'
    // : 'ai.uploadAndAIComplete'
    const noti = ElNotification({
      title: t('ai.uploadcomplete'),
      message: allowFeature('AI_CLASSIFICATION') ? t(message) : '',
      type: 'success',
      duration: 0,
      customClass: 'cursorPointer',
      onClick: () => {
        tabProvider.openTab(
          createAiUploadDetail({
            id: content.uploadId
          })
        )
        const ev = new CustomEvent('closeUploadDrawer')
        document.dispatchEvent(ev)
        noti.close()
      }
    })
    const requetUpload = uploadState.value.uploadRequestList.find((item) => item.uploadAiId === content.uploadId)
    if (requetUpload) requetUpload.aiFinish = true
  }
}

function handleReplaceFileWithAi(content) {
  if (content.idOrPath) {
    const noti = ElNotification({
      title: t('status.completed'),
      message: t('ai.confirmAiMetadataExtractionViewDocument'),
      type: 'success',
      duration: 0,
      onClick: () => {
        openFileDetail(content.idOrPath, {
          showInfo: true,
          showHeaderAction: true,
          openEdit: true
        })
        noti.close()
      }
    })
    const requetUpload = uploadState.value.uploadRequestList.find((item) => item.uploadAiId === content.uploadId)
    if (requetUpload) requetUpload.aiFinish = true
  }
}

function handleShowNotification(content) {
  let type = 'success'
  if (content.notiStatus && failList.includes(content.notiStatus)) type = 'error'
  const noti = ElNotification({
    title: t('tip.notification'),
    message: t(content.templateId),
    type,
    duration: 6000,
    onClick: () => {
      noti.close()
    }
  })
}

function handleWorkflow(content: any) {
  const message = JSON.parse(content.message)

  const eventType = message.eventType
  console.log('handleWorkflow', message, content)
  switch (eventType) {
    case 'calendar' :
      handleCalendar(message)
      break
    case 'caseDashboard':
      handleOpenCaseDashboard(message)
      break
    default :
      handleShowDefaultNotification(content)
      break
  }
}

function handleShowDefaultNotification(content: any) {
  const notification = ElNotification({
    title: t('tip.notification'),
    message: content,
    type: 'success',
    duration: 6000,
    onClick: () => {
      notification.close()
    }
  })
}

function handleCalendar(message: any) {
  let msg
  try {
    const contentMsg = JSON.parse(message.additionalContent)
    msg = `${contentMsg.title}\n${contentMsg.data}`
  } catch (e) {
    msg = message.additionalContent
  }

  const notification = ElNotification({
    title: t('tip.notification'),
    message: msg,
    type: 'success',
    duration: 6000,
    onClick: async () => {
      const newItem = routeCalendarManagement(message.processInstanceId, 'calendar')
      tabProvider?.openTab(newItem, true)
      notification.close()
    }
  })
}

function handleOpenCaseDashboard(message: any) {
  const notification = ElNotification({
    title: t('tip.notification'),
    message: 'Open Case Dashboard.',
    type: 'success',
    duration: 0,
    onClick: async () => {
      const caseInstance = await newClientApi.getCaseInstanceCaseidCaseid(message.additionalContent).then((res) => res.data)
      const data = {
        instanceId: message.additionalContent,
        versionId: caseInstance.cmmnVersionId
      }
      const newItem = caseManageDashboardPage(data)
      tabProvider?.openTab(newItem, true)
      notification.close()
    }
  })
}

onMounted(() => {
  getUnreadCount()
  messageHandlers.value.push({
    name: 'localMessageDialog',
    handler: messageChange
  })
})

onBeforeUnmount(() => {
  messageHandlers.value = messageHandlers.value.filter((item) => item.name !== 'localMessageDialog')
})
</script>

<style lang="scss" scoped>
.actionIcons {
  --icon-size: var(--app-font-size-xl);
}
</style>
