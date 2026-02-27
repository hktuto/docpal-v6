<script setup lang="ts">
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
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
  state.row = deepCopy(row)
  state.row.name = ''
  state.visible = true
}

const rules = reactive([
  { required: true, message: t('render.hint.fieldRequired', { name: t('dpTable_name') }), trigger: 'blur' }
])

const formRef = ref()

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  try {
    const data: any = await newAdminApi.postDocpalIdTemplates({ name: state.row.name }).then((res) => res.data)
    if (!data) return
    state.row.id = data.id
    await newAdminApi.putDocpalIdTemplatesId(data.id, { ...data, ...state.row })
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
    <el-form ref="formRef" label-position="top">
      <el-form-item prop="name" :label="t('dpTable_name')" :rules="rules">
        <el-input v-model="state.row.name " />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="UniqueId__Duplicate__Submit" type="primary" @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
