<template>
  <el-dialog v-model="state.visible" :title="`${$t('dpDocument_acl_editLocal')} (${state.aclItem.userId})`" :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="FolderCabinetSetting__Info__LocalPermission__EditTime__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './permissionEditTimeDialog.vform.json'

const props = defineProps<{
  id: string
}>()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,
  aclItem: {}
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    const params: any = {
      id: props.id,
      userId: state.aclItem.userId,
      permission: state.aclItem.permission
    }
    if (data.time === 'dateBase') {
      params.startDate = data.dateRange[0]
      params.endDate = data.dateRange[1]
    }
    state.loading = true
    await clientApi.admin.postAdmindmsCabinetTemplatePermission(params)
    state.visible = false
    emits('refresh')
  } catch (error) {
  } finally {
    state.loading = false
  }
}

async function handleOpen(aclItem: any) {
  state.visible = true
  state.aclItem = aclItem
  await new Promise((resolve) => setTimeout(resolve, 10))
  const params: any = {
    time: !!aclItem.startDate ? 'dateBase' : 'permanent'
  }
  if (aclItem.startDate) {
    params.dateRange = [aclItem.startDate, aclItem.endDate]
  }
  FormRendererRef.value.vFormRenderRef.setFormData(params)
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
