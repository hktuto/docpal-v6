<script setup lang="ts">
import formJson from './duplicateDialog.vform.json'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const FormRendererRef = ref()
const props = defineProps<{
  row: any
}>()

const emits = defineEmits(['refresh'])

const state = reactive<{
  loading: boolean
  visible: boolean
  row: any
}>({
  loading: false,
  visible: false,
  row: {
    name: ''
  }
})

function handleOpen(row: any) {
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.row = deepCopy(row)
    state.row.name = ''
    FormRendererRef.value.vFormRenderRef.setFormData(state.row)
  }, 100)
  state.visible = true
}

async function handleSubmit() {
  try {
    let { name } = await FormRendererRef.value.getFormData()
    const data = await clientApi.admin.postAdmindocpalIdTemplates({ name: name }).then((res) => res.data)
    state.row.id = data.id
    await clientApi.admin.putAdmindocpalIdTemplatesId(data.id, { ...data, ...state.row })
    routerProvider?.message.success(
      t('tip_createdSuccessMsg', {
        modelName: t('adminMenu.uniqueIdGenerator'),
        name: name
      })
    )
    state.visible = false
    emits('refresh')
  } catch (e) {
    console.log(e)
  }
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible" :title="t('uniQueIdGenerator_duplicate')" width="500">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UniqueId__Duplicate__Submit" type="primary" @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
