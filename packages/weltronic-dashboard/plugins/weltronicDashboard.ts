
import { DASHBOARD_TYPE } from '#imports'
export default defineNuxtPlugin((nuxtApp) => {
  const dashboardWidgetSetting = useDashboardWidgetSetting()
  const dbDashboardWidgetSetting = useDbDashboardWidgetSetting()

  dashboardWidgetSetting.value.weltronic = {
    type: DASHBOARD_TYPE.weltonic,
    label: 'weltronic',
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
  // dashboardWidgetSetting.value.wclPoStat = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'wclPoStat',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWclPoStat',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.wclInventoryStat = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'wclInventoryStat',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWclInventoryStat',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.wclInventoryAging = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'wclInventoryAging',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWclInventoryAging',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.wclIncomingStat = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'wclIncomingStat',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWclIncomingStat',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.wclInventoryIO = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'wclInventoryIO',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWclInventoryIO',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.soSalesOverview = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'soSalesOverview',
  //   minW: 6,
  //   minH: 3,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 3,
  //   component: 'LazyDashboardSoSalesOverview',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.soMonthlyShipment = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'soMonthlyShipment',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardSoMonthlyShipment',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.soCustomerPending = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'soCustomerPending',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardSoCustomerPending',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dashboardWidgetSetting.value.soInventoryAging = {
  //   type: DASHBOARD_TYPE.weltonic,
  //   label: 'soInventoryAging',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardSoInventoryAging',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // dbDashboardWidgetSetting.value.weltonic = {
  //   type: 'record',
  //   label: 'Sample Request Form',
  //   minW: 6,
  //   minH: 6,
  //   maxW: 12,
  //   maxH: 6,
  //   w: 6,
  //   h: 6,
  //   component: 'LazyDashboardWeltronicSampleRequestForm',
  //   setting: {
  //     home: {},
  //     hideSetting: []
  //   }
  // }
  // const { formRenderSlots, formStartHandle } = useWorkflow()
  // formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
})
