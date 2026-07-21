import WHAReceivingVerification from '../components/WHAReceiving/verification/index.vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { formRenderSlots, formStartHandle } = useWorkflow()
  formRenderSlots.value.push({ name: 'WHAReceivingVerification', component: WHAReceivingVerification })
})
