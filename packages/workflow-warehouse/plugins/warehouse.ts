import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'
import WHASupplyListInvoiceVerify from '../components/WHASupplyList/invoiceVerify/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
  formRenderSlots.value.push({ name: 'WHASupplyListInvoiceVerify', component: WHASupplyListInvoiceVerify })
})
