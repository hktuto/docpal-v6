<template>
  <div
    v-infinite-scroll="getList"
    test-id="notification-detail"
    class="infinite-list"
    style="overflow: auto; height: 100%"
    :infinite-scroll-disabled="state.scrollNoMore || state.loading"
    :infinite-scroll-immediate="false"
  >
    <div v-for="item in state.list" :key="item.id" class="infinite-list-item">
      <div class="notificationContent">
        <div>{{ formatDate(item.createdDateTimestamp) }}</div>
        <div class="dp-title" v-if="item.content.templateId">
          {{
            $t(item.content.templateId, {
              userId: item.creator,
              documentName: item.content.documentName,
              businessName: item.content.businessName,
              emailList: item.content.emailList,
              email: item.content.email,
              path: item.content.path,
              fileName: item.content.fileName
            })
          }}
        </div>
        <div v-if="item.content.message" style="white-space: pre-wrap;">
          {{ handleMessage(item.content.message) }}
        </div>
        <!--        <el-alert v-if="item.content.message" :title="item.content.message"-->
        <!--                  :type="JSON.parse(item.content.message).level" :closable="false" />-->
        {{ item.content.comment }}
        <div>{{ item.creator }}</div>
        <div>
          <el-button :loading="item.loading" :test-id="`notification-dismiss-button-${item.id}`" type="info"
                     @click="handleDismiss(item)">
            {{ $t('button.dismiss') }}
          </el-button>
          <el-button v-if="notiShowView(item)" :test-id="`notification-view-button-${item.id}`" type="primary"
                     @click="handleView(item)">
            {{ $t('button.view') }}
          </el-button>
        </div>
        <el-divider />
      </div>
    </div>
    <p v-if="state.loading" class="center">{{ $t('dpTip.loading') }}</p>
    <p v-if="!state.loading && state.scrollNoMore" class="center">{{ $t('dpTip.noMore') }}</p>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { TabManagerKey } from '#imports'

const tabProvider = inject(TabManagerKey)
const props = defineProps(['type'])
const emits = defineEmits(['close', 'unreadCountChange'])

const router = useRouter()

const userId = useUserId()
const pageParams = ref({
  pageNum: 0,
  pageSize: 10,
  receiveId: userId.value,
  orderBy: 'createdDate',
  isDesc: true
})

const state = reactive<any>({
  list: [],
  totalSize: 0,
  loading: false,
  scrollNoMore: true
})

async function getList() {
  const param: any = {
    readStatus: 'CREATE'
  }
  if (props.type !== 'Unread') param.type = props.type
  try {
    state.loading = true
    const { data: res }: any = await clientApi.api.postNotificationList({ ...param, ...pageParams.value })
    res.entryList.map((item: any) => {
      try {
        if (typeof item.content === 'string') {
          item.content = JSON.parse(item.content)
          if (typeof item.content.emailList === 'string') item.content.emailList = JSON.parse(item.content.emailList).join(',')
        }
      } catch (error) {
        console.error('parse notification content error', error)
      } finally {
        return item
      }
    })
    state.list.push(...res.entryList)
    state.totalSize = res.totalSize
    pageParams.value.pageNum++
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
    state.scrollNoMore = state.list.length >= state.totalSize
  }
}

async function handleDismiss(item: any) {
  try {
    item.loading = true
    await clientApi.api.putNotificationIdStatusStatus(item.id, 'READED')
    const index = state.list.findIndex((lItem: any) => lItem.id === item.id)
    state.list.splice(index, 1)
    emits('unreadCountChange', item)
  } catch (error) {
    console.log(error)
  } finally {
    item.loading = false
  }
}

async function handleView(item: any) {
  notiHandleView(item, tabProvider)
  // handleDismiss(item)
  emits('close')
}

function initData(noGetData: boolean = false) {
  state.list = []
  pageParams.value.pageNum = 0
  if (!noGetData) getList()
}

function handleMessage(message: any) {
  try {
    const content = JSON.parse(message)
    if (content.showNotification && content.additionalContent) {
      let msg
      const eventType = content.eventType
      // TODO: workflow notification task event type
      switch (eventType) {
        case 'calendar':
          try {
            const contentMsg = JSON.parse(content.additionalContent)
            msg = `${contentMsg.title}\n${contentMsg.data}`
          } catch (e) {
            msg = content.additionalContent
          }
          break
        case 'caseDashboard':
          msg = 'Open Case Dashboard.'
          break
        default:
          msg = content.additionalContent
      }
      return msg
    }
    console.log('message', message, typeof message)
    // message maybe a  json string
    try {
      const content = JSON.parse(message)
      return content.message || content.additionalContent || 'No Message'
    } catch (e) {
      return message
    }
  } catch (e) {
    return message
  }
}

onMounted(() => {
  initData()
})
defineExpose({ initData })
</script>
<style lang="scss" scoped>
.el-divider--horizontal {
  margin: var(--app-space-xs) 0;
}

.notificationContent {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.center {
  text-align: center;
}
</style>
