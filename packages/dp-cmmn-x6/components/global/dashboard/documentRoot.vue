<script lang="ts" setup>
import { newClientApi } from 'api'
import { CaseManagementDashboardKey } from '@packages/dp-cmmn-x6/utils/caseProvider'
import { inject, provide, ref } from 'vue';
const props = withDefaults(
  defineProps<{
    dates?: any
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {
      home: 'rootId'
    },
    hideSetting: false
  }
)
const emits = defineEmits(['refreshSetting', 'delete'])
const caseDetail = ref<any>()
const home = ref({ secondId: '/', disabled: true })
const idOrPath = ref('')
const homeId = ref('')
function changeRoute(id: string) {
  idOrPath.value = id
}
const caseProvider: any = inject(CaseManagementDashboardKey)
async function getCDBasciInfo() {
  let caseData: any = {}
  try {
    if (caseData?.fields?.length > 0) return caseData
    const id = caseProvider.instanceId?.value || null
    const versionId = caseProvider.versionId?.value || null
    if (id) {
      caseData = await newClientApi.getCaseDashboardInstanceCaseidPrimaryformData(id).then(r =>r.data)
    } else if (versionId) {
      caseData = await newClientApi.getCaseDashboardVersionVersionidPrimaryform(versionId).then(r =>r.data)
    } else {
      caseData = {
        fields: [],
        rows: []
      }
    }
  } catch (error) {
    console.log(error)
    caseData = {
      fields: [],
      rows: []
    }
  } finally {
    return caseData
  }
}
async function getHomeId() {
  caseDetail.value = await getCDBasciInfo()
  if (caseDetail.value.rows) {
    const _item = caseDetail.value.rows.find((d: any) => d.id === props.setting.home)
    if (!!_item && _item.value) {
      homeId.value = _item.value
      home.value.secondId = _item.value
      idOrPath.value = _item.value
    }
  }
}
// #region module: setting
function handleDelete() {
  emits('delete')
}
function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}
const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props,
  handleRefreshAction: async (setting: any) => {
    homeId.value = ''
    await new Promise((resolve) => setTimeout(resolve, 300))
    await getHomeId()
  }
})
// #endregion
onMounted(() => {
  getHomeId()
})
provide(BrowseListProviderKey, {
  getchildApi: (pageParams: any) => {
    return newClientApi.postDmsDocumentChildrenThumbnail(pageParams)
  },
  idOrPath,
  changeRoute
})
</script>

<template>
  <DashboardCard
    v-loading="loading"
    class="o-auto dp-dashboard--card__padding dp-dashboard--card__scroll"
    ref="cardRef"
    :hideSetting="hideSetting"
    :setting="setting"
    :settingRef="settingRef"
    :extraParams="[caseDetail? caseDetail.fields : null]"
    :title="setting.name || ''"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <div v-if="homeId" class="rootContainer">
      <BrowseMiniTable ref="tableRef" :home="homeId">
        <template #toolbar_buttons>
          <BrowseBreadcrumb :idOrPath="idOrPath" :home="home" />
        </template>
      </BrowseMiniTable>
    </div>
    <div v-else-if="setting?.home"><el-skeleton :rows="5" /></div>
    <div v-else>{{ $t('el.table.emptyText') }}</div>
    <DashboardDocumentRootSetting ref="settingRef" @delete="handleDelete" @refresh="handleRefresh"></DashboardDocumentRootSetting>
  </DashboardCard>
</template>
<style lang="scss" scoped>
.rootContainer {
  height: 100%;
  overflow: hidden;
}
</style>
