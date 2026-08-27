import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'
import WHInvoiceSupplyList from '../components/WHInvoice/supplyList/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
  formRenderSlots.value.push({ name: 'WHInvoiceSupplyList', component: WHInvoiceSupplyList })
  // 兼容旧表单插槽名
  formRenderSlots.value.push({ name: 'WHASupplyListInvoiceVerify', component: WHInvoiceSupplyList })
})
