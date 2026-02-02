<template>
  <el-dialog v-model="state.visible" class="scroll-dialog" :title="$t('contactBook.create')"
             :close-on-click-modal="false" destroy-on-close>
    <ContactBookPermissionForm ref="ContactBookPermissionRef" />
    <ContactBookFieldSetting ref="ContactBookFieldSettingRef" />
    <template #footer>
      <el-button id="CaseManagement__CreateNewCaseTemplate__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'

const { t } = useI18n()
const emits = defineEmits(['refresh'])

const state = reactive({
  loading: false,
  visible: false
})
const ContactBookPermissionRef = ref()
const ContactBookFieldSettingRef = ref()

async function handleSubmit() {
  try {
    state.loading = true
    const data = await ContactBookPermissionRef.value.getFormData()
    const fieldData = await ContactBookFieldSettingRef.value.getFieldData()
    const params = {
      ...data,
      attributes: fieldData,
      status: 'A'
    }
    console.log(data, fieldData)
    const res = await newClientApi.postDmsContactGroup(params).then((res: any) => res.data)
    ElMessage.success(t('dpMsg_success'))
    state.visible = false
    if (!!res) {
      emits('refresh', res)
    }
  } catch (error) {
    console.log('error', error)
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.visible = true
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
