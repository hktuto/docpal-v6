<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? $t('companyProfile.chopEdit') : $t('companyProfile.chopCreate')"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form :model="form" label-width="80px" ref="formRef" :rules="rules" label-position="top">
      <el-form-item :label="$t('companyProfile.chopName')" prop="name" required>
        <el-input v-model="form.name"
                  :placeholder="$t('render.hint.fieldRequired', { name: $t('companyProfile.chopName') })"></el-input>
      </el-form-item>
      <el-form-item :label="$t('common_status')" prop="status" required>
        <el-switch v-model="form.status" active-text="Active" inactive-text="Inactive" active-value="A"
                   inactive-value="D"></el-switch>
      </el-form-item>
      <el-divider></el-divider>
      <div style="margin-bottom: 10px; color: #888">{{ $t('dpTable_permission') }}</div>
      <el-form-item label="User, User Role" prop="permissions">
        <el-select v-model="form.permissions" multiple placeholder="Select" style="width: 100%">
          <el-option-group v-for="group in permissionOptions" :key="group.label" :label="$t(group.label)">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
          <!-- <el-option v-for="item in permissionOptions" :key="item" :label="item" :value="item" /> -->
        </el-select>
      </el-form-item>
      <el-divider></el-divider>
      <CompanyProfilePictureUpload v-model="form.file" @upload-success="fileChange = true" />
      <!-- 图片上传部分可忽略 -->
    </el-form>
    <template #footer>
      <div class="footer-grid">
        <el-button id='CompanyProfile__NewProfile_Detail__AddChop_Dialog__Cancel' @click="visible = false">
          {{ $t('cancelText') }}
        </el-button>
        <el-button id="CompanyProfile__NewProfile_Detail__AddChop_Dialog__Submit" type="primary" :loading="loading"
                   @click="onSave">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'
import {
  getUserAndRolePermissionSelectOption,
  convertPermissionObjectByPermissions,
  convertPermissionsByPermissionObject
} from '#imports'

const props = defineProps<{
  companyId?: string
}>()

const emits = defineEmits(['refresh'])

const visible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const editData = ref<any>(null)
const fileChange = ref(false)
const formRef = ref()
const form = ref<any>({
  name: '',
  status: 'A',
  permissions: [],
  file: null
})

const permissionOptions = ref<any>([])

const rules = {
  name: [{ required: true, message: 'Please enter name', trigger: 'blur' }],
  permissions: [{ required: true, message: 'Please select permissions', trigger: 'change' }]
}

// 重置表单
function resetForm() {
  form.value = {
    name: '',
    status: 'A',
    permissions: []
  }
  formRef.value?.resetFields()
}

// 打开添加对话框
function handleAdd() {
  isEdit.value = false
  editData.value = null
  visible.value = true
  resetForm()
}

// 打开编辑对话框
async function handleEdit(data: any) {
  isEdit.value = true
  editData.value = data
  visible.value = true
  fileChange.value = false
  const file = await newAdminApi.getAdmindmsCompanyprofilesCompanyidChopsCompanychopidFile(props.companyId as string, data.id, {
    format: 'blob'
  })

  const permission = {
    user: [] as string[],
    role: [] as string[]
  }
  if (!!data.users) {
    permission.user = data.users.split(',')
  }
  if (!!data.roles) {
    permission.role = data.roles.split(',')
  }

  // 填充表单数据
  form.value = {
    name: data.name || '',
    status: data.status,
    permissions: convertPermissionsByPermissionObject(permission),
    file
  }
}

async function getOptions() {
  permissionOptions.value = await getUserAndRolePermissionSelectOption()
}

// 保存数据
async function onSave() {
  try {
    if (!form.value.file) {
      ElMessage.error('Please upload a file')
      return
    }
    await formRef.value?.validate()
    loading.value = true
    const permissionsObject = convertPermissionObjectByPermissions(form.value.permissions)
    const formData = new FormData()

    // TODO: 接口數據接口不符合規範
    formData.append('status', form.value.status)
    formData.append('name', form.value.name)
    if (!!permissionsObject.role && permissionsObject.role.length > 0) {
      formData.append('roles', permissionsObject.role as any)
    }
    if (!!permissionsObject.user && permissionsObject.user.length > 0) {
      formData.append('users', permissionsObject.user as any)
    }
    if (isEdit.value && editData.value) {
      // 编辑模式
      if (fileChange.value) {
        formData.append('file', form.value.file)
      }
      await newAdminApi.putAdmindmsCompanyprofilesCompanyidChopsCompanychopid(props.companyId as string, editData.value.id, formData as any, { format: 'blob' }).then(r => r.data)
      ElMessage.success('Updated successfully')
    } else {
      // 添加模式
      formData.append('file', form.value.file)
      await newAdminApi.postAdmindmsCompanyprofilesCompanyidChops(props.companyId as string, formData, { format: 'blob' }).then(r => r.data)
      ElMessage.success('Created successfully')
    }

    visible.value = false
    emits('refresh')
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getOptions()
})
// 暴露方法给父组件
defineExpose({
  handleAdd,
  handleEdit
})
</script>

<style lang="scss" scoped>
.footer-grid {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
