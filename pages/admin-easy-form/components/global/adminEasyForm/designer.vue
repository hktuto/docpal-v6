<template>
  <div v-loading="!state.loadField" class="pageContainer--padding">
    <FormDesigner v-if="state.loadField" ref="FormDesignerRef" :fieldListApi="state.fieldListApi">
      <template #submit>
        <el-button
          id="EasyForm__Detail__FormPreview__EditForm__Submit"
          class="el-button el-button--primary is-link"
          :loading="state.submitLoading"
          @click="handleSubmit"
        >
          {{ $t('submit') }}
        </el-button>
      </template>
    </FormDesigner>
  </div>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { id } = defineProps<{
  id: string
}>()
const state = reactive<State>({
  submitLoading: false,
  detail: {},
  fieldListApi: {},
  loadField: false
})
const FormDesignerRef = ref()

async function handleSubmit() {
  const json = FormDesignerRef.value.getFormJson()
  const param: any = {
    id: id,
    previewStyle: JSON.stringify(json)
  }
  try {
    state.submitLoading = true
    const res = await newAdminApi.postDmsEasyFormSavePreview(param)
    if (!!res) routerProvider?.message.success(t('msg_successfullyModified'))
  } catch (error) {
  } finally {
    state.submitLoading = false
  }
}

function handleFiledList(list: any) {
  state.loadField = false
  // formProperties
  state.fieldListApi = {
    labelKey: 'id',
    nameKey: 'id',
    data: list.map((item: any) => ({ id: item.name }))
  }
  state.loadField = true
}

async function getDetail() {
  state.detail = await newAdminApi.getDmsEasyFormDraftId(id).then((res) => res.data)
  if (!state.detail) state.detail = {}

  if (!state.detail.previewStyle)
    state.detail.previewStyle =
      '{"widgetList":[],"formConfig":{"modelName":"formData","refName":"vForm","rulesName":"rules","labelWidth":80,"labelPosition":"left","size":"","labelAlign":"label-left-align","cssCode":"","customClass":"","functions":"","layoutType":"PC","onFormCreated":"","onFormMounted":"","onFormDataChange":""}}'
  state.detail.json = JSON.parse(state.detail.previewStyle)

  if (!state.detail.information) state.detail.information = []
  handleFiledList(state.detail.information)

  setTimeout(() => {
    FormDesignerRef.value.setFormJson(state.detail.json)
  })
}

onMounted(() => {
  state.loadField = false
  getDetail()
})
</script>

<style lang="scss" scoped></style>
