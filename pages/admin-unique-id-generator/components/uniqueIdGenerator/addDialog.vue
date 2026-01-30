<script setup lang="ts">
import formJson from './addDialog.vform.json'
import { clientApi } from 'api'
import { routeUniqueIdGeneratorDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const FormRendererRef = ref()

const state = reactive<{
  loading: boolean
  visible: boolean
}>({
  loading: false,
  visible: false
})

function handleOpen() {
  state.visible = true
}

async function handleSubmit() {
  try {
    let { name } = await FormRendererRef.value.getFormData()
    state.loading = true
    const data = await clientApi.admin.postAdmindocpalIdTemplates({ name: name }).then((res) => res.data)
    state.visible = false
    routerProvider?.message.success(
      t('tip_createdSuccessMsg', {
        modelName: t('adminMenu.uniqueIdGenerator'),
        name: name
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
  <el-dialog v-model="state.visible" :title="t('uniQueIdGenerator_duplicate')" width="500">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button :disabled="state.loading" :loading="state.loading" id="UniqueId__Add__Confirm" type="primary" @click="handleSubmit">
        {{ t('dpButtom_confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
