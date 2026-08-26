
import { DASHBOARD_TYPE } from '#imports'
export default defineNuxtPlugin((nuxtApp) => {
  const dashboardWidgetSetting = useDashboardWidgetSetting()
  dashboardWidgetSetting.value.weltronic = {
    type: DASHBOARD_TYPE.weltonic,
    label: 'Weltronic',
    minW: 6,
    minH: 6,
    maxW: 12,
    maxH: 6,
    w: 6,
    h: 6,
    component: 'LazyDashboardWeltronicShipCopy',
    setting: {
      home: {},
      hideSetting: []
    }
  }
  // const { formRenderSlots, formStartHandle } = useWorkflow()
  // formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
})
