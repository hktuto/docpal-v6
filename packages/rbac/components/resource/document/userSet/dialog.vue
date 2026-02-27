<template>
  <el-dialog
    v-loading="loading"
    v-model="dialogVisible"
    class="scroll-dialog big"
    :title="permissionId ? $t('rbac.permission.editUserSet') : $t('rbac.permission.addUserSet')"
    
    append-to-body
    destroy-on-close
    center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="user-set-content" v-loading="loading">
      <!-- 用户权限设置内容 -->
      <div class="left">
        <ElForm ref="formRef" :model="formData" label-position="top">
          <ElFormItem
            :label="$t('rbac.permission.userSetName')"
            prop="configurationRuleName"
            :rules="[{ required: true, message: $t('render.hint.fieldRequired', { name: $t('rbac.permission.userSetName') }), trigger: 'change' }]"
          >
            <ElInput v-model="formData.configurationRuleName" />
          </ElFormItem>
        </ElForm>
        <ResourceDocumentUserSetForm :targetOptions="targetOptions" ref="userSetFormRef" />
        <ResourceDocumentUserSetDocForm ref="userSetDocFormRef" />
      </div>
      <div class="right">
        <ResourceDocumentPermissionDetailCheckboxForm ref="checkboxFormRef" :isUserSet="true" />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ $t('button.close') }}</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="handleConfirm">{{ $t('confirmText') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { newAdminApi } from 'api'
const props = defineProps<{
  targetOptions: any[]
}>()
const dialogVisible = ref(false)
const loading = ref(false)
const confirmLoading = ref(false)
const permissionId = ref('')
const resourceId = ref('') // documentId
const checkboxFormRef = ref()
const userSetFormRef = ref()
const userSetDocFormRef = ref()
const emits = defineEmits(['success'])
const formRef = ref()
const formData = ref({
  configurationRuleName: ''
})
const open = async (row: any, documentId: string) => {
  try {
    permissionId.value = row?.id || ''
    resourceId.value = documentId
    dialogVisible.value = true
    if (row?.id) {
      loading.value = true
      const aclPermission = await newAdminApi.getDocpalAclResourcePermissionsId(row.id).then((res) => res.data)
      userSetFormRef.value.setFormData(aclPermission.members)
      userSetDocFormRef.value.setFormData(aclPermission.rules[0])
      checkboxFormRef.value.setData({
        permissionLevel: 5,
        permissionIds: aclPermission.permissionIds
      })
      formData.value.configurationRuleName = row.configurationRuleName
    } else {
      setTimeout(() => {
        userSetFormRef.value.setFormData()
        userSetDocFormRef.value.setFormData()
        checkboxFormRef.value.setData({
          permissionLevel: 5,
          permissionIds: [1, 2, 3, 4, 5]
        })
      })
    }
  } catch (e) {
    throw new Error(e)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  permissionId.value = ''
}

const handleConfirm = async () => {
  try {
    confirmLoading.value = true
    await formRef.value.validate()
    const userformData = userSetFormRef.value.getFormData()
    const docData = userSetDocFormRef.value.getFormData()
    const permissondata = checkboxFormRef.value.getData()
    const params = {
      permissionLevel: 5,
      permissionIds: permissondata.permissionIds,
      configurationRuleName: formData.value.configurationRuleName,
      targetType: 4,
      resourceId: resourceId.value,
      resourceType: 1,
      members: userformData,
      rules: [docData]
    }
    if (permissionId.value) {
      await newAdminApi.putDocpalAclResourcePermissionsId(permissionId.value, params)
    } else {
      await newAdminApi.postDocpalAclResourcePermissions(params)
    }
    emits('success')
  } catch (e) {
    console.error(e)
    return
  } finally {
    confirmLoading.value = false
  }
  handleClose()
}

defineExpose({
  open
})
</script>

<style scoped>
.user-set-content {
  width: 100%;
  /*  left and right panel */
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  justify-content: flex-start;
  align-items: flex-start;
  .left {
    flex: 1;
  }
  .right {
    padding-top: 10px;
  }
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
