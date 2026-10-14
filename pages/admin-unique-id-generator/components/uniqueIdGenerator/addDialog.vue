<script setup lang="ts">
import { newAdminApi } from 'api'
import { routeUniqueIdGeneratorDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive<{
  loading: boolean
  visible: boolean
  name: string
}>({
  loading: false,
  visible: false,
  name: ''
})

function handleOpen() {
  state.visible = true
}

const rules = reactive([{ required: true, message: t('render.hint.fieldRequired', { name: t('uniQueIdGenerator_name') }), trigger: 'blur' }])

const formRef = ref()

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  try {
    state.loading = true
    if (state.name.trim() === '') return

    const data = await newAdminApi.postDocpalIdTemplates({ name: state.name }).then((res) => res.data)
    state.visible = false
    routerProvider?.message.success(
      t('tip_createdSuccessMsg', {
        modelName: t('adminMenu.uniqueIdGenerator'),
        name: state.name
      })
    )
    routerProvider?.navigateTo(routeUniqueIdGeneratorDetail(data), false)
  } catch (e) {
    console.log(e)
  } finally {
    state.loading = false
  }
}

defineExpose({ handleOpen })
</script>
<template>
  <el-dialog v-model="state.visible" :title="t('uniQueIdGenerator_add_title')" width="500">
    <el-form :model="state" ref="formRef" label-position="top">
      <el-form-item prop="name" :label="t('uniQueIdGenerator_name')" :rules="rules">
        <el-input v-model="state.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="state.loading" :loading="state.loading" id="UniqueId__Add__Confirm" type="primary" @click="handleSubmit">
        {{ t('dpButtom_confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
