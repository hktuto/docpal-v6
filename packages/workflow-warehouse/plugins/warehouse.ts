import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'
import WHInvoiceSupplyList from '../components/WHInvoice/supplyList/index.vue'
import WHInvoiceShip from '../components/WHInvoice/ship/index.vue'
import WHShippingConfirm from '../components/WHShippingConfirm/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
  formRenderSlots.value.push({ name: 'WHInvoiceSupplyList', component: WHInvoiceSupplyList })
  formRenderSlots.value.push({ name: 'WHInvoiceShip', component: WHInvoiceShip })
  formRenderSlots.value.push({ name: 'WHShippingConfirm', component: WHShippingConfirm })
})
