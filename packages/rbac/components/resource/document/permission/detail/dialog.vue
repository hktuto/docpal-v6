<template>
  <el-dialog v-model="dialogVisible" :title="$t('rbac.permission.detail')" width="80%" append-to-body :close-on-click-modal="false" @close="handleClose">
    <div class="permission-detail-content">
      <!-- 权限详情内容 -->
      <ResourceDocumentPermissionDetailForm ref="formRef" :targetOptions="targetOptions" :isEdit="isEditMode" />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose"> {{ $t('button.close') }}</el-button>
        <el-button :loading="loading" type="primary" @click="handleConfirm">{{ $t('confirmText') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { newAdminApi } from 'api'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const props = defineProps<{
  targetOptions: any[]
}>()
const emits = defineEmits(['success'])
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()
const isEditMode = ref(false)
const { t } = useI18n()
let permissionId = ''
type FormData = {
  resourceId: string
  resourceType: number // (1=Document)
  targetType: number // (1=User, 2=Role, 3=Group, 4=User Set)
  targetId: string
  permissionLevel: number //(1=Read, 2=ReadWrite, 3=Manage, 4=Custom, 5=Configuration Set)
  permissionIds: number[]
  configurationRuleName: string
  members: any[] //TODO : create type
  rules: any[] //TODO : create type
}
async function open(row: any, documentId: string) {
  isEditMode.value = false
  if (!documentId) {
    throw new Error('documentId is required')
  }
  dialogVisible.value = true
  let formData: FormData
  // if row is not null, get form data from api
  if (row) {
    isEditMode.value = true
    permissionId = row.id
    formData = JSON.parse(JSON.stringify(row))
  } else {
    formData = {
      resourceId: documentId,
      resourceType: 1,
      targetType: 2,
      targetId: '',
      permissionLevel: 1,
      permissionIds: [],
      configurationRuleName: '',
      members: [],
      rules: []
    }
  }
  setTimeout(() => {
    formRef.value?.setFormData(formData)
  }, 100)
  // formRef.value?.setFormData(formData)
}

const handleConfirm = async () => {
  try {
    const data = await formRef.value.getFormData()
    if (!data) return
    if(data.permissionLevel === 4 && data.permissionIds.length === 0) {
      ElMessage.error(t('tip.selectAtLeastOnePermission'))
      return
    }
    loading.value = true
    // 处理确认逻辑
    if (isEditMode.value) {
      await newAdminApi.putDocpalAclResourcePermissionsId(permissionId, data)
    } else {
      await newAdminApi.postDocpalAclResourcePermissions(data)
    }
    loading.value = false
    emits('success')
    handleClose()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

defineExpose({
  open
})
</script>

<style scoped>
.permission-detail-content {
  min-height: 200px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
