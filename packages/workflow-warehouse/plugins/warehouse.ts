import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'
import WHInvoiceSupplyList from '../components/WHInvoice/supplyList/index.vue'
import WHInvoiceShip from '../components/WHInvoice/ship/index.vue'
import WHShippingConfirm from '../components/WHShippingConfirm/index.vue'
import WHUserSwitcherPlatform from '../components/WH/userSwitcherPlatform.vue'
export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  const globalUserPopoverSlots = useGlobalUserPopoverSlots()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
  formRenderSlots.value.push({ name: 'WHInvoiceSupplyList', component: WHInvoiceSupplyList })
  formRenderSlots.value.push({ name: 'WHInvoiceShip', component: WHInvoiceShip })
  formRenderSlots.value.push({ name: 'WHShippingConfirm', component: WHShippingConfirm })

  globalUserPopoverSlots.value.push({
    name: 'user-switcher',
    order:0,
    component: WHUserSwitcherPlatform,
    show: true,
  })
  console.log("globalUserPopoverSlots", globalUserPopoverSlots.value)
})
