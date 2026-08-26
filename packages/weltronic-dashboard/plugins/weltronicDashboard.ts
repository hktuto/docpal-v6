
import { DASHBOARD_TYPE } from '#imports'
export default defineNuxtPlugin((nuxtApp) => {
  const dashboardWidgetSetting = useDashboardWidgetSetting()
  dashboardWidgetSetting.value.weltronic = {
    type: DASHBOARD_TYPE.weltonic,
    label: 'Weltronic',
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 6,
    w: 3,
    h: 3,
    component: 'LazyPersonalBrowse',
    setting: {
      home: {},
      hideSetting: []
    }
  }
  // const { formRenderSlots, formStartHandle } = useWorkflow()
  // formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
})
