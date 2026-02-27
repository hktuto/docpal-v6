<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  type DashboardWidgetSetting,
  getNormalizeSetting
} from '../../../../../packages/dp-dashboard/utils/dashboardWidgetHelper'
import { newClientApi } from 'api'

const { id } = defineProps<{
  id: number;
}>()
const state = reactive({
  info: {
    name: ''
  } as any,
  layout: [] as DashboardWidgetSetting[],
  loading: false,
  saveLoading: false,
  dates: [
    dayjs().startOf('year').format('YYYY-MM-DD'),
    dayjs(new Date()).format('YYYY-MM-DD')
  ]
})

async function getInfo() {
  state.info = await newClientApi.getDsbUserDashboardsId(id).then((res) => res.data)
  if (!state.info || !state.info.styleJson) return
  const temLayout = JSON.parse(state.info.styleJson)
  if (Array.isArray(temLayout)) {
    state.layout = temLayout.map((item) => {
      return Object.assign(item, getNormalizeSetting(item.label))
    })
  }
}

onMounted(() => {
  getInfo()
})
</script>
<template>
  <div class="pageContainer--padding">
    <DashboardDate v-model="state.dates" />
    <div style="overflow: auto;">
      <DashboardDetail
        ref="DashboardDetailRef"
        v-model:layout="state.layout"
        :dates="state.dates"
        :hideSetting="true"
        :resizable="false"
        :draggable="false"
      ></DashboardDetail>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.pageContainer--padding {
  position: relative;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
}

</style>
