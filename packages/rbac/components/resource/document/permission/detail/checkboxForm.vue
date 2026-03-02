<template>
  <div>
    <el-divider content-position="left">{{ $t('rbac.permissions', {type: $t('permission.read')}) }}</el-divider>
    <ResourceDocumentPermissionDetailCheckbox
      :ref="
        (el) => {
          CheckboxRef.read = el
        }
      "
      :checkAllLabel="$t('permission.allRead')"
      v-model:checkAll="formData.allRead"
      :options="[
        { label: 'rbac.permission.viewFolder', value: 1 },
        { label: 'rbac.permission.viewMetadata', value: 2 },
        { label: 'rbac.permission.print', value: 3 },
        { label: 'rbac.permission.download', value: 4 },
        { label: 'rbac.permission.read', value: 5 }
      ]"
      v-model="formData.readPermissions"
      @change="(v) => handleChange(v, 'read')"
    />

    <el-divider content-position="left">{{ $t('rbac.permissions', {type: $t('permission.write')}) }}</el-divider>
    <ResourceDocumentPermissionDetailCheckbox
      :ref="
        (el) => {
          CheckboxRef.readWrite = el
        }
      "
      :checkAllLabel="$t('permission.allWrite')"
      v-model:checkAll="formData.allReadWrite"
      :options="[
        { label: 'rbac.permission.editFolder', value: 6 },
        { label: 'rbac.permission.editSubContent', value: 7 },
        { label: 'rbac.permission.editMetadata', value: 8 },
        { label: 'share.share', value: 9 },
        { label: 'rbac.permission.createFolder', value: 10 },
        { label: 'rbac.permission.createFile', value: 11 }
      ]"
      v-model="formData.readWritePermissions"
      @change="(v) => handleChange(v, 'readWrite')"
    />

    <el-divider content-position="left">{{ $t('rbac.permissions', {type: $t('permission.manage')}) }}</el-divider>
    <ResourceDocumentPermissionDetailCheckbox
      :ref="
        (el) => {
          CheckboxRef.manage = el
        }
      "
      :checkAllLabel="$t('permission.allManage')"
      v-model:checkAll="formData.allManage"
      :options="[
        { label: 'rbac.permission.deleteFolder', value: 12 },
        { label: 'rbac.permission.deleteSubContent', value: 13 },
        { label: 'rbac.permission.assignPermission', value: 14 },
        { label: 'rbac.permission.addUserSet', value: 15 }
      ]"
      v-model="formData.managePermissions"
      @change="(v) => handleChange(v, 'manage')"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    isUserSet: boolean,
}>();
const CheckboxRef = ref({})

type FormData = {
  allRead: boolean
  allReadWrite: boolean
  allManage: boolean
  readPermissions: number[]
  readWritePermissions: number[]
  managePermissions: number[]
}

const formData = ref<FormData>({
  allRead: false,
  allReadWrite: false,
  allManage: false,
  readPermissions: [],
  readWritePermissions: [],
  managePermissions: []
})

function handleChange(value, type) {
  if (!value) return
  if (type === 'read') {
    CheckboxRef.value.read.handleCheckAllChange2(value)
  }
  if (type === 'readWrite') {
    CheckboxRef.value.read.handleCheckAllChange2(value)
    CheckboxRef.value.readWrite.handleCheckAllChange2(value)
  } else if (type === 'manage') {
    CheckboxRef.value.read.handleCheckAllChange2(value)
    CheckboxRef.value.readWrite.handleCheckAllChange2(value)
    CheckboxRef.value.manage.handleCheckAllChange2(value)
  }
}

function convertToFormData(data: SaveData) {
  const newFormData: any = {
    readPermissions: [],
    readWritePermissions: [],
    managePermissions: []
  }
  if (!data.permissionIds) return newFormData
  const arr = ['read', 'readWrite', 'manage']
  arr.forEach((type) => {
    newFormData[type + 'Permissions'] = CheckboxRef.value[type].filterPermission(data.permissionIds)
  })
  // postAclResourcePermissions
  return newFormData
}

function getData() {
  const data = {
    permissionLevel: 0,
    permissionIds: []
  }
  if (!props.isUserSet && formData.value.allRead && formData.value.readWritePermissions.length === 0 && formData.value.managePermissions.length === 0) {
    data.permissionLevel = 1 // Read
  } else if (!props.isUserSet && formData.value.allRead && formData.value.allReadWrite && formData.value.managePermissions.length === 0) {
    data.permissionLevel = 2 // ReadWrite
  } else if (!props.isUserSet && formData.value.allRead && formData.value.allReadWrite && formData.value.allManage) {
    data.permissionLevel = 3 // Manage
  } else {
    data.permissionLevel = props.isUserSet ? 5 : 4 // Custom
    data.permissionIds = [...formData.value.readPermissions, ...formData.value.readWritePermissions, ...formData.value.managePermissions]
  }
  return data
}
function setData(data: FormData) {
  formData.value = convertToFormData(data)
  setTimeout(() => {
    if (data.permissionLevel === 1) {
      formData.value.allRead = true
      handleChange(true, 'read')
    } else if (data.permissionLevel === 2) {
      formData.value.allRead = true
      formData.value.allReadWrite = true
      handleChange(true, 'readWrite')
    } else if (data.permissionLevel === 3) {
      formData.value.allRead = true
      formData.value.allReadWrite = true
      formData.value.allManage = true
      handleChange(true, 'manage')
    } 
  })
}
defineExpose({
  getData,
  setData
})
</script>

<style scoped>
.el-divider {
  margin: 20px 0;
}
.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
