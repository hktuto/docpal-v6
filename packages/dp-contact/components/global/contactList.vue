<template>
  <div :class="['pageContainer--padding', { 'contact-manage-page': isManage }]" v-loading="loading">
    <div class="contactList--left" v-if="isManage">
      <ContactBookPermissionForm ref="ContactBookPermissionRef" @v-form-change="handleFormChange" />
      <ContactBookFieldSetting ref="ContactBookFieldSettingRef" mode="edit" :id="id" @refresh="init" />
    </div>
    <ContactListTable class="contactList--right" ref="ContactListTableRef" :id="id" :detail="detail" :name="name" />
    <!-- <ContactListTable2 :id="id" :detail="detail" /> -->
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox, ElMessage } from 'element-plus'
import { newClientApi } from 'api'

const tableColumnRender = reactive({
  name: 'TableColumnRender'
})
const { t } = useI18n()
const props = defineProps<{
  id: string
  name: string
}>()
const permissionHelper = useContactPermissionHelper()
const contactDetailHelper = useContactDetailHelper()
const { isManage } = toRefs(permissionHelper)
const detail = ref()
const loading = ref(false)
const initLoading = ref(false)
const ContactListTableRef = ref()
const ContactBookPermissionRef = ref()
const ContactBookFieldSettingRef = ref()

async function init(isInitTable = true) {
  try {
    loading.value = true
    initLoading.value = true
    const res: any = await newClientApi.getDmsContactGroupId(props.id).then((res) => res.data)
    if (!res) {
      return
    }
    detail.value = res
    if (!res.hasPermissions) res.hasPermissions = ['Read']
    await permissionHelper.getPermission(res.hasPermissions)
    contactDetailHelper.init(res)
    if (isInitTable) {
      setTimeout(() => {
        ContactListTableRef.value.init()
        ContactBookPermissionRef.value?.setFormData(detail.value)
        ContactBookFieldSettingRef.value?.setFieldData(detail.value.attributes)
      }, 10)
    }
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
    setTimeout(() => {
      initLoading.value = false
    }, 1000)
  }
}

async function handleFormChange({ fieldName, newValue, oldValue, formModel }: any) {
  if (initLoading.value) return

  // 僅使用put數據的接口，減少冗餘接口
  // const params = {
  //   ...contactDetail,
  //   attributes: detail.value.attributes,
  //   status: detail.value.status
  // }
  // await newClientApi.putDmsContactGroupId(props.id, params).then(r => r.data)

  // TODO: delete
  if (fieldName === 'name') {
    await updateDetail({ fieldName, newValue, oldValue })
  } else {
    let _newValue = newValue ? JSON.parse(JSON.stringify(newValue)) : []
    let _oldValue = oldValue ? JSON.parse(JSON.stringify(oldValue)) : []
    if (_newValue.length > _oldValue.length) {
      await contactAddPermission({ fieldName, newValue: _newValue, oldValue: _oldValue })
    } else if (_newValue.length < _oldValue.length) {
      await contactRemovePermission({ fieldName, newValue: _newValue, oldValue: _oldValue })
    }
  }
}

async function updateDetail({ fieldName, newValue, oldValue }: any) {
  try {
    initLoading.value = true
    const permissions = await ContactBookPermissionRef.value.getFormData()
    const params = {
      name: newValue,
      permissions: permissions.permissions,
      attributes: detail.value.attributes,
      status: detail.value.status
    }
    await newClientApi.putDmsContactGroupId(props.id, params).then(r => r.data)
  } catch (error) {
    console.log(error)
    await resetPermission(fieldName, oldValue)
    ElMessage.error(t('dpMsg_error'))
  } finally {
    await resetInitLoading()
  }
}

async function contactAddPermission({ fieldName, newValue, oldValue }: any) {
  try {
    initLoading.value = true
    const addItem = newValue.filter((item: string) => !oldValue.includes(item))
    const segments = addItem[0].split('_')
    const params = {
      dataType: segments[0],
      value: segments.slice(1).join('_'),
      name: capitalizeFirstLetter(fieldName)
    }
    await newClientApi.postDmsContactGroupIdPermission(props.id, params)
    ElMessage.success(t('dpMsg_success'))
  } catch (error) {
    console.log(error)
    await resetPermission(fieldName, oldValue)
    ElMessage.error(t('dpMsg_error'))
  } finally {
    await resetInitLoading()
  }
}

async function contactRemovePermission({ fieldName, newValue, oldValue }: any) {
  try {
    initLoading.value = true
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
  } catch (error) {
    await resetPermission(fieldName, oldValue)
    return
  }
  try {
    const removeItem = oldValue.filter((item: string) => !newValue.includes(item))
    const segments = removeItem[0].split('_')

    const params = {
      dataType: segments[0],
      value: segments.slice(1).join('_'),
      name: capitalizeFirstLetter(fieldName)
    }
    await newClientApi.patchDmsContactGroupIdPermission(props.id, params).then(r => r.data)
    ElMessage.success(t('dpMsg_success'))
  } catch (error) {
    await resetPermission(fieldName, oldValue)
    ElMessage.error(t('dpMsg_error'))
  } finally {
    await resetInitLoading()
  }
}

async function resetPermission(fieldName: string, oldValue: any) {
  ContactBookPermissionRef.value.setFieldValue(fieldName, oldValue)
  ContactBookPermissionRef.value.setDisabledForm(true)
  await resetInitLoading(1000)
  ContactBookPermissionRef.value.setDisabledForm(false)
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

async function resetInitLoading(time = 100) {
  await new Promise((resolve) => {
    setTimeout(() => {
      initLoading.value = false
      resolve(true)
    }, time)
  })
}

provide('contactDetailHelper', contactDetailHelper)
provide('contactBookPermissionHelper', permissionHelper)
onMounted(() => {
  init()
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}

.contact-manage-page {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--app-space-s);

  .contactList--left {
    padding-right: var(--app-space-s);
    border-right: 1px solid var(--app-grey-800);
    overflow-y: auto;
  }
}
</style>
