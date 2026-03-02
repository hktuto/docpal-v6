<template>
  <div class="sharePageContent" v-if="shareState">
    <template v-if="shareState === 'list'">
      <main v-loading="state.loading">
        <ShareTable ref="tableRef" :tableData="state.shareList">
          <template #toolbar_buttons>
            <h3 class="title">{{ $t('share_shareFiles') }}</h3>
            <!-- <el-button @click="getData()"> {{ $t('refresh') }}</el-button> -->
          </template>
        </ShareTable>
      </main>
    </template>
    <template v-if="shareState === 'expired'">
      <main class="expired">{{ $t('share_shareExpired') }}</main>
    </template>
  </div>
  <SharePassword v-else @submit="handleGetPublicDocument"></SharePassword>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const route = useRoute()
const state = reactive<any>({
  shareState: '',
  shareList: [],
  loading: false
})
const { shareState, shareList } = toRefs(state)
const { t } = useI18n()

function getData() {
  const password = sessionStorage.getItem('sharePWD')
  if (password) handleGetPublicDocument({ password })
}

const tableRef = ref()

async function handleGetPublicDocument(formData: any) {
  try {
    state.loading = true
    formData.token = !!route.query.token ? route.query.token : formData.token
    if (!formData.token) throw new Error(`${t('responseMsg_errorCode_2')}`)
    const res: any = await newClientApi.getDmsPublicShareDocuments(formData).then((res) => res.data)
    if (res.errorCode) {
      switch (res.errorCode) {
        case 10:
          shareState.value = 'expired'
          return
        default:
          throw new Error(res.message)
      }
      sessionStorage.removeItem('sharePWD')
    } else if (res instanceof Array) {
      state.shareList = []
      sessionStorage.setItem('sharePWD', formData.password)
      state.shareList.push(...res)
      state.shareState = 'list'
      setTimeout(() => {
        tableRef.value?.loadData(state.shareList)
      }, 10)
    } else {
      sessionStorage.removeItem('sharePWD')
    }
  } catch (error) {
    state.shareState = ''
    // routerProvider?.message.error(error?.response?.data?.message || error.message)
  }
  state.loading = false
}

onMounted(() => {
  getData()
})
</script>

<style lang="scss" scoped>
.sharePageContent {
  height: 100vh;
  overflow: hidden;
}

main {
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: var(--app-space-xs) calc(var(--app-space-xs) * 3) 1rem;
}

.expired {
  padding-top: 10%;
  text-align: center;
  font-size: 3rem;
}

.title {
  font-size: 1.4rem;
  line-height: 1.2;
  font-weight: 700;
  white-space: nowrap;
  color: var(--primary-color);
  padding: 1rem calc(var(--app-space-xs) * 3);
  background: var(--app-grey-700);
  margin: unset;
}

:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}
</style>
