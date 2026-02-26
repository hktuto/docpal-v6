<template>
  <DashboardCard
    ref="cardRef" v-loading="loading"
    class="dp-dashboard--card__padding"
    :title="props.setting.scanType + ' ' + $t('dashboard.threshold')"
    :hideSetting="hideSetting"
    :setting="setting"
    :settingRef="settingRef"
    @delete="handleDelete"
    @refresh="refresh"
  >
    <el-progress
      :percentage="state.percentage"
      :show-text="false"
      :stroke-width="16"
      :status="state.initData.currentCount > state.initData.thresholdCount ? 'exception' : ''"
    />
    <h3>{{ state.initData.currentCount }} / {{ state.initData.thresholdCount }}</h3>
    <DashboardSetting ref="settingRef" :formJson="formJson" @delete="handleDelete" @refresh="handleRefresh">
      <template v-if="state.cutOffDates && state.cutOffDates.startDate">
        {{ formatDate(state.cutOffDates.startDate) }} ~
        {{ formatDate(state.cutOffDates.endDate) }}
      </template>
    </DashboardSetting>
  </DashboardCard>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { newClientApi } from 'api'
import formJson from './threshold.vform.json'

dayjs.extend(isBetween)
const props = defineProps(['setting', 'dates', 'hideSetting'])
const emits = defineEmits(['refreshSetting', 'delete'])
const state = reactive<any>({
  initData: {},
  percentage: 0,
  cutOffTime: null,
  cutOffDates: {}
})

async function getData(scanType: string) {
  try {
    let params: any = { scanType }
    const dates = await getDates()
    state.cutOffDates = dates
    if (dates) params = { ...params, ...dates }
    // const da
    const counts: any = await newClientApi.postDsbOcrThreshold(params).then((res) => res.data)
    state.initData = counts
    state.percentage = ((counts.currentCount / counts.thresholdCount) * 100).toFixed(2)
  } catch (error) {
    console.log(error)
  }
}

async function getDates() {
  try {
    const currentDate = new Date()
    const setting: any = await newClientApi.getDsbAzureOcrSetting().then((res) => res.data)
    state.cutOffTime = setting.cutOffTime
    const diffYear = dayjs(currentDate).diff(state.cutOffTime, 'year')
    let base = getBaseDiffYear(state.cutOffTime, currentDate)
    let startDate = dayjs(state.cutOffTime)
      .add(diffYear + base, 'year')
      .format('YYYY-MM-DD')
    let endDate = dayjs(state.cutOffTime)
      .add(diffYear + base + 1, 'year')
      .subtract(1, 'day')
      .format('YYYY-MM-DD')

    while (!dayjs(currentDate).isBetween(startDate, endDate, 'day', '[]')) {
      base++
      startDate = dayjs(state.cutOffTime)
        .add(diffYear + base, 'year')
        .format('YYYY-MM-DD')
      endDate = dayjs(state.cutOffTime)
        .add(diffYear + base + 1, 'year')
        .subtract(1, 'day')
        .format('YYYY-MM-DD')
    }
    return { startDate, endDate }
  } catch (error) {
    return null
  }

  function getBaseDiffYear(date1, date2) {
    const _date1 = new Date(date1)
    const _date1Month = _date1.getMonth()
    const _date1Date = _date1.getDate()
    const _date2 = new Date(date2)
    const _date2Month = _date2.getMonth()
    const _date2Date = _date2.getDate()
    return _date1Month === _date2Month && _date1Date === _date2Date ? -2 : -1
  }
}

// #region module: setting
const { settingRef, cardRef, refresh, loading } = useDashboardCard({
  props,
  handleInitCardAction: (setting: any) => {
    getData(setting.scanType)
  }
})

function handleDelete() {
  emits('delete')
}

function handleRefresh(chartSetting: any) {
  emits('refreshSetting', chartSetting)
}

// #endregion

defineExpose({})
</script>
<style lang="scss" scoped>
h3 {
  margin: var(--app-space-s) 0;
}
</style>
