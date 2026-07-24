import WHASupplyListVerify from '../components/WHASupplyList/Verify/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHASupplyListVerify', component: WHASupplyListVerify })
})
