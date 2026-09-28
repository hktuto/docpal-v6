<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { clientApi, newClientApi } from 'api'
import UserSettingProfileCompany from '@packages/user-setting/components/global/userSetting/profile/company.vue'
import UserSettingProfileDepartment from '@packages/user-setting/components/global/userSetting/profile/department.vue'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { updateUser } = useAdminUser()
const props = defineProps<{
  user: any
}>()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,
  form: {}
})

const officesOptions = ref<any[]>([])
async function getOffices() {
  try {
    officesOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/offices`).then((r) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

const branchOfficesOptions = ref<any[]>([])
async function getBranchOffices() {
  try {
    branchOfficesOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/branch-offices`).then((r) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

async function getOrganization(orgId: number) {
  try {
    return await clientApi.instance.get(`/apis/v1/ms/oracle/org-mapping/convert?org_id=${orgId}`).then((r) => r.data)
  } catch (e) {
    console.log(e)
  }
}

async function handleSubmit() {
  try {
    const orgId = branchOfficesOptions.value.find((item) => item.branch_office == state.form.department).org_id
    const organization = await getOrganization(orgId)
    const data = {
      userId: state.form.userId,
      firstName: state.form.firstName,
      lastName: state.form.lastName,
      phone: state.form.phone,
      email: state.form.email,
      userLevel: state.form.userLevel,
      oracleUserInfo: state.form.oracleUserInfo,
      org: {
        organizationId: String(organization.organization_id),
        organizationCode: organization.organization_code,
        organizationName: organization.organization_name,
        operatingId: String(orgId),
        operatingName: state.form.department
      }
    }
    state.loading = true
    await updateUser(data)

    ElMessage.success(t('tip_updateMsg', { modelName: t('user_info'), name: data.userId }))
    state.visible = false
    emits('refresh')
  } catch (error) {}
  state.loading = false
}

async function handleOpen() {
  state.form = { ...(props.user ?? {}) }
  state.form.originalGroups = props.user.groups
  state.form.groups = state.form.groups.map((item: any) => item.name)
  if (state.form.org.length > 0) {
    state.form.company = state.form.org[0].organizationCode
    state.form.department = state.form.org[0].operatingName
  }

  state.visible = true
}

const properties = ref<any[]>([])

async function getUserProfileFields() {
  const { properties: propertiesMap } = await newClientApi.getDmsUserProfileSetting().then((res: any) => res.data)
  if (!propertiesMap) {
    properties.value = []
    return
  }

  properties.value = Object.entries(propertiesMap)
    .map(([key, value]: [string, any]) => ({
      key,
      ...value
    }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function isCustomer(key: string) {
  const userProfile = {
    company: {
      name: 'Company',
      component: UserSettingProfileCompany
    },
    department: {
      name: 'Department',
      component: UserSettingProfileDepartment
    }
  }
  return userProfile[key as keyof typeof userProfile]
}

onMounted(() => {
  getUserProfileFields()
  getOffices()
  getBranchOffices()
})

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('user_editUser')" :close-on-click-modal="false">
    <div style="height: 500px; max-height: 600px; overflow-y: auto">
      <el-form :model="state.form" label-position="top">
        <el-form-item v-for="item in properties" :label="t(`user.setting.${item.key}`)" :key="item.key">
          <template v-if="isCustomer(item.key)">
            <component :is="isCustomer(item.key)?.component" v-model="state.form[item.key]" :item="item" />
          </template>

          <div v-else style="width: 100%">
            <el-input v-if="item.type === 'string'" v-model="state.form[item.key]" :disabled="item.readyOnly" />
            <el-input-tag v-if="item.type === 'array'" v-model="state.form[item.key]" :disabled="item.readyOnly" />
            <el-switch
              v-if="item.type === 'boolean'"
              v-model="state.form[item.key]"
              :disabled="item.readyOnly"
              :inactive-text="t('actions.inactive')"
              :active-text="t('user_active')"
            />
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button id="UserList__Info__Edit__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
