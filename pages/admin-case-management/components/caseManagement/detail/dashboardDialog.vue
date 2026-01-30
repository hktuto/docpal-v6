<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('caseManagement.editDashboard') : $t('caseManagement.addDashboard')"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form label-position="top" :model="state">
      <el-form-item :label="t('dpTable_label')" required prop="label">
        <el-input v-model="state.label" id="CaseManagement__Detail__CaseDashboardView__Add__Label" />
      </el-form-item>
      <el-form-item :label="t('dpTable_permission')" required prop="permission">
        <el-select v-model="state.permission" multiple filterable collapse-tags :max-collapse-tags="6"
                   :placeholder="t('common_selectedIsMultiSelectRequiredMsg')"
                   id="CaseManagement__Detail__CaseDashboardView__Add__Permission">
          <el-option-group v-for="group in permissionOptions" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button id="CaseManagement__Detail__CaseDashboardView__Add__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import {
  getRoleAndGroupPermissionSelectOption,
  convertPermissionObjectByPermissions,
  convertSelectOptions
} from '#imports'

const permissionOptions = ref<any>([])
const emits = defineEmits(['refresh'])
const { t } = useI18n()

const props = defineProps<{
  caseDetail: any
  caseTypeId: string
  name: string
  currentVersion: string,
  caseDetailId: string
}>()
const state = reactive<any>({
  loading: false,
  visible: false,
  isEdit: false,
  id: '',
  label: '',
  permission: []
})

async function handleSubmit() {
  try {
    const form = {
      caseTypeId: props.caseDetailId,
      cmmnVersionId: props.caseTypeId,
      label: state.label,
      permissions: convertPermissionObjectByPermissions(state.permission)
    }

    if (!state.isEdit) {
      await newAdminApi.postAdmincaseDashboard(form)
    } else {
      await newAdminApi.putAdmincaseDashboard({
        ...form,
        id: state.id
      })
    }
    state.visible = false
    emits('refresh')
  } catch (e) {
    console.log(e)
  }
}

function handleOpen(setting: any) {
  state.visible = true
  if (!!setting) {
    state.isEdit = true
    state.id = setting.id
    state.label = setting.label
    state.permission = convertSelectOptions(setting.permissions)
  } else {
    state.isEdit = false
    state.label = ''
    state.permission = []
  }
}

onMounted(async () => {
  permissionOptions.value = await getRoleAndGroupPermissionSelectOption()
})

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
