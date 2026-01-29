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
import { ElMessage } from 'element-plus'
import { adminApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const props = defineProps(['detail'])

const state = reactive<any>({
  groups: '',
  loading: false,
  options: []
})
const form = ref({
  permission: ''
})

async function handleChange() {
  try {
    state.loading = true
    if (!form.value?.permission || form.value.permission.length === 0) return
    const groups = state.options[0].options.filter((item: any) => form.value.permission.includes(item.value))
    const roles = state.options[1].options.filter((item: any) => form.value.permission.includes(item.value))
    await adminApi.api.postFormDesignSavePermission({
      id: props.detail.id,
      permissions: {
        group: groups.map((item: any) => item.value),
        role: roles.map((item: any) => item.value)
      }
    })
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    state.loading = false
  }
}
const { flatRole } = useRBAC()

async function init() {
  const groupList = await adminApi.api.postNuxeoIdentityGroups().then((res) => res.data)
  state.options = [
    {
      label: t('user_groups'),
      options: groupList.map((item: any) => ({
        label: item.name,
        value: item.id
      }))
    },
    {
      label: t('user_role'),
      options: flatRole.value.map((item: any) => ({
        label: item.name,
        value: item.id
      }))
    }
  ]
}
onMounted(() => init())
watch(
  () => props.detail,
  (newValue, oldValue) => {
    if (!!oldValue && oldValue.permission === newValue.permission) return
    if (!!newValue.permission) form.value.permission = newValue.permission.split(',')
  },
  {
    immediate: true
  }
)
</script>
<style lang="scss" scoped></style>
