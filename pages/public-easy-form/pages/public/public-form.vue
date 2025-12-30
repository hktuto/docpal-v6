<template>
  <div class="public-form">
    <div class="form-main" v-loading="state.formJsonLoad">
      <FormRenderer
        ref="FormRendererRef"
        :form-json="state.formJson"
      />
    </div>
    <div class="flex-x-end">
      <el-button id="Public_Form_Submit" type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

const route = useRoute()
const router = useRouter()

const state = reactive<any>({
  formJsonLoad: false,
  formJson: {},
  detail: {}
})
const FormRendererRef = ref()

async function getFormJson() {
  try {
    state.formJsonLoad = true
    state.detail = await clientApi.api.getDmsEasyFormIdDetail(route.query?.id as string).then(res => res.data)
    console.log(state.detail)
    const json = state.detail.previewStyle
    state.formJson = JSON.parse(json)
    FormRendererRef.value.setFormJson(state.formJson)

  } catch (error) {
    // const json = '{"widgetList":[{"key":37325,"type":"input","icon":"text-field","formItemFlag":true,"options":{"name":"age","label":"age","labelAlign":"","type":"text","defaultValue":"","placeholder":"","columnWidth":"200px","size":"","labelWidth":null,"labelHidden":false,"readonly":false,"disabled":false,"hidden":false,"clearable":true,"showPassword":false,"required":false,"requiredHint":"","validation":"","validationHint":"","customClass":[],"labelIconClass":null,"labelIconPosition":"rear","labelTooltip":null,"minLength":null,"maxLength":null,"showWordLimit":false,"prefixIcon":"","suffixIcon":"","appendButton":false,"appendButtonText":"","prependText":"","appendButtonDisabled":false,"buttonIcon":"custom-search","onCreated":"","onMounted":"","onInput":"","onChange":"","onFocus":"","onBlur":"","onEnter":"","onValidate":"","onAppendButtonClick":""},"id":"input51245"},{"key":37325,"type":"input","icon":"text-field","formItemFlag":true,"options":{"name":"User Name","label":"user name","labelAlign":"","type":"text","defaultValue":"","placeholder":"","columnWidth":"200px","size":"","labelWidth":null,"labelHidden":false,"readonly":false,"disabled":false,"hidden":false,"clearable":true,"showPassword":false,"required":false,"requiredHint":"","validation":"","validationHint":"","customClass":"","labelIconClass":null,"labelIconPosition":"rear","labelTooltip":null,"minLength":null,"maxLength":null,"showWordLimit":false,"prefixIcon":"","suffixIcon":"","appendButton":false,"appendButtonText":"","prependText":"","appendButtonDisabled":false,"buttonIcon":"custom-search","onCreated":"","onMounted":"","onInput":"","onChange":"","onFocus":"","onBlur":"","onEnter":"","onValidate":"","onAppendButtonClick":""},"id":"input44496"}],"formConfig":{"modelName":"formData","refName":"vForm","rulesName":"rules","labelWidth":80,"labelPosition":"top","size":"","labelAlign":"label-left-align","cssCode":"","customClass":"","functions":"","layoutType":"PC","jsonVersion":3,"onFormCreated":"","onFormMounted":"","onFormDataChange":"","saveRemoteOptions":"never","labelFormUniqueName":true,"onFormValidate":"","dataSources":[]}}'
    // state.formJson = JSON.parse(json)
  } finally {
    state.formJsonLoad = false
  }
}

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData(true, false)
    const params = Object.keys(data).reduce((prev: any, key) => {
      const item = data[key]
      if (item instanceof Array && item[0].response) {
        const ids = item.reduce((prevd, dItem) => {
          if (dItem.response?.data?.id) prevd.push(dItem.response.data.id)
          return prevd
        }, [])
        prev[key] = ids.join(',')
      } else {
        prev[key] = data[key]
      }
      return prev
    }, {})

    // easy form email 日志追踪
    // const logId = route.query.emailBusinessLogId
    // if(!!logId) params.emailBusinessLogId = logId
    await clientApi.api.postDmsEasyFormSubmitData({
      id: route.query.id as string,
      emailBusinessLogId: route.query.emailBusinessLogId,
      params
    })
    router.push('/public/uploadTip?tip=easyFormSubmitSuccessfully')
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  getFormJson()
})
const browseTitle = computed(() => {
  return state.detail?.name || 'Docpal'
})
useHead({
  title: browseTitle
})
</script>
<style lang="scss" scoped>
.public-form {
  height: 100%;
  overflow: hidden;
  padding: var(--app-space-xs);
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-xs);

  .form-main {
    overflow: auto;
  }
}
</style>
