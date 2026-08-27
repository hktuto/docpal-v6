import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'
import WHInvoiceSupplyList from '../components/WHInvoice/supplyList/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
  formRenderSlots.value.push({ name: 'WHInvoiceSupplyList', component: WHInvoiceSupplyList })
})
