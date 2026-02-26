<template>
  <DashboardCard
    v-loading="loading"
    class="dp-dashboard--card__scroll dp-dashboard--card__padding"
    ref="cardRef"
    :hideSetting="hideSetting"
    :title="$t(setting.documentType)"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="handleInitCard"
  >
    <template #title_suffix>
      <DashboardUserFilter
        class="el-icon--right"
        :user="state.filterUser"
        :show="setting.showUserFilter"
        @refreshSetting="handleFilterUser"
      ></DashboardUserFilter>
    </template>
    <div class="trendContainer">
      <DocCoCountFileCount v-if="setting.showCount" ref="DocCoCountCountRef" :dates="dates" :setting="setting"
                           :user="state.filterUser" />
      <DocCoCountSize v-if="setting.showSize" ref="DocCoCountSizeRef" :dates="dates" :setting="setting"
                      :user="state.filterUser" />
    </div>
    <el-button v-if="state.drillDownFlag" :loading="state.drillDownBackLoading" @click="handleDrillDownBack" text>
      {{ $t('dpButtom_back') }}
    </el-button>
    <div class="metaContainer" style="--trend-columns: 1fr 1fr 1fr 1fr">
      <DocCoCountMeta
        v-for="item in setting.displayList"
        :ref="
          (el) => {
            displayListRef[item.meta] = el
          }
        "
        :documentType="setting.documentType"
        :user="setting.user"
        :meta="item.meta"
        :data="metaData[`group_${item.meta}`]"
        @drillDown="handleDrillDown"
      />
    </div>
    <DocCoCountDialog ref="settingRef" @delete="handleDelete" @refresh="handleRefresh" />
  </DashboardCard>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: false
  }
)
const emits = defineEmits(['refreshSetting', 'delete'])
const metaData = ref<any>({})
const state = reactive<any>({
  drillDownBackLoading: false,
  drillDownFlag: false,
  drillDownParams: {},
  filterUser: ''
})

const DocCoCountCountRef = ref()
const DocCoCountSizeRef = ref()
const displayListRef = ref<any>({})
const { cardRef, settingRef, resize, handleInitCard, loading } = useDashboardCard({
  props,
  resizeAction: () => {
    DocCoCountCountRef?.value.resize()
    DocCoCountSizeRef?.value.resize()
    Object.keys(displayListRef.value).forEach((key) => {
      const item = displayListRef.value[key]
      if (item) item.resize()
    })
  },
  handleInitCardAction: (setting: any) => {
    state.filterUser = setting.user
    DocCoCountCountRef?.value.handleInitCard(setting)
    DocCoCountSizeRef?.value.handleInitCard(setting)
    getMetaData()
  }
})

function handleFilterUser(user: any) {
  state.filterUser = user
  getMetaData()
}

const GetCoCountMetaApi = async (params: any) => {
  if (params.creator) return await newClientApi.postDsbNewFilesUserMetaDtypeRange(params).then((res) => res.data)
  return await newClientApi.postDsbNewFilesUsersMetaDtypeRange(params).then((res) => res.data)
}
const GetCoCountMetaFilterApi = async (params: any) => {
  if (params.creator) return await newClientApi.postDsbNewFilesSpecifiedUserDtypeRangeFilterMetadata(params).then((res) => res.data)
  return await newClientApi.postDsbNewFilesUserDtypeRangeFilterMetadata(params).then((res) => res.data)
}

async function getMetaData() {
  const params: any = {
    groupByMetadatas: props.setting.displayList.map((item: any) => item.meta),
    primaryType: props.setting.documentType,
    creator: state.filterUser
  }
  if (props.dates) {
    params.isQueryList = true
    params.dateRange = {
      from: props.dates[0],
      to: props.dates[1]
    }
  }
  try {
    metaData.value = await GetCoCountMetaApi(params)
  } catch (error) {
    console.log(error)
  }
}

async function handleDrillDownBack() {
  state.drillDownParams = {}
  state.drillDownBackLoading = true
  try {
    await getMetaData()
    state.drillDownFlag = false
  } catch (error) {
    console.log(error)
  }
  state.drillDownBackLoading = false
}

async function handleDrillDown(metaParams: any) {
  state.drillDownParams[metaParams.meta] = metaParams.key
  try {
    const params: any = {
      filterByMetaDatas: state.drillDownParams,
      creator: state.filterUser,
      primaryType: props.setting.documentType,
      groupByMetadatas: props.setting.displayList.map((item: any) => item.meta)
    }
    if (props.dates) {
      params.isQueryList = true
      params.dateRange = {
        from: props.dates[0],
        to: props.dates[1]
      }
    }
    metaData.value = await GetCoCountMetaFilterApi(params)
    state.drillDownFlag = true
  } catch (error) {
    console.log(error)
  }
}

function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}

defineExpose({
  resize
})
</script>

<style lang="scss" scoped>
.trendContainer {
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  container-type: inline-size;
}

.metaContainer {
  display: flex;
  flex-flow: row wrap;
  container-type: inline-size;
  padding: 0 var(--el-card-padding);
}

@container (min-width: 640px) {
  .co-count {
    flex: 1 0 50%;
    max-width: 50%;
  }

  .co-count-meta {
    flex: 1 0 25%;
    max-width: 25%;
  }
}

:deep(.co-count-chart) {
  width: 100%;
  height: 100%;
  min-height: 250px;
}
</style>
