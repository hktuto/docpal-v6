<template>
  <el-card>
    <h3 class="title">{{ $t('easyForm.permission') }}</h3>
    <el-form ref="FormRef" label-position="top" :model="form">
      <el-formItem
        :label="$t('user_UserGroup')"
        prop="permission"
        :rules="[{ required: true, message: $t('user_UserGroup') + $t('render.hint.fieldRequired') }]"
      >
        <el-select-v2
          v-model="form.permission"
          :options="state.options"
          multiple
          filterable
          clearable
          :placeholder="t('common_selectedIsMultiSelectRequiredMsg')"
          :disabled="state.loading"
          @change="handleChange"
        ></el-select-v2>
      </el-formItem>
    </el-form>
  </el-card>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import {
  convertPermissionObjectByPermissions,
  convertPermissionsByPermissionObject,
  getRoleAndGroupPermissionSelectOption
} from '#imports'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const props = defineProps(['detail'])

const state = reactive<any>({
  groups: '',
  loading: false,
  options: []
})
const form = ref({
  permission: []
})

async function handleChange() {
  try {
    state.loading = true
    if (form.value.permission.length === 0) return
    await clientApi.api.postDmsEasyFormSavePermission({
      id: props.detail.id,
      permissions: convertPermissionObjectByPermissions(form.value.permission)
    })
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    state.loading = false
  }
}

async function init() {
  state.options = await getRoleAndGroupPermissionSelectOption()
}

onMounted(() => init())
watch(() => props.detail, (newValue, oldValue) => {
    if (!!oldValue && oldValue.permission === newValue.permission) return
    if (!!newValue.permissions) {
      form.value.permission = convertPermissionsByPermissionObject(newValue.permissions)
    }
  }, {
    immediate: true
  }
)
</script>
<style lang="scss" scoped></style>
