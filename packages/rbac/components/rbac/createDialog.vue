<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('orgChart.editSidebar.addRole')"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item :label="$t('orgChart.editSidebar.roleLabel')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('orgChart.editSidebar.rolePlaceholder')" />
      </el-form-item>

      <el-form-item 
        v-if="formData.type === 1 && roleOptions.length > 0"
        :label="$t('orgChart.editSidebar.parentRole')" 
        prop="parentRoleId"
      >
        <el-select
          v-model="formData.parentId"
          :placeholder="$t('orgChart.editSidebar.parentRolePlaceholder')"
          clearable
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">{{ $t('orgChart.editSidebar.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ $t('orgChart.editSidebar.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { newAdminApi } from 'api'
import type { FormInstance } from 'element-plus'

const { t } = useI18n()

interface RoleFormData {
  name: string
  parentId?: number
  status: number
  type: number
}

const props = defineProps<{
  roleOptions: Array<{ id: number; name: string }>
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<RoleFormData>({
  name: '',
  parentId: undefined,
  status: 1, // Always active for new roles
  type: 1 // Default type is 1
})

const rules = {
  name: [
    { required: true, message: t('orgChart.editSidebar.validation.roleRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: t('orgChart.editSidebar.validation.minLength'), trigger: 'blur' }
  ]
}

function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  formData.name = ''
  formData.parentId = undefined
  formData.status = 1 // Reset to active
  formData.type = 1 // Reset to default type
}

function open(defaultValues?: Partial<RoleFormData>) {
  resetForm()
  if (defaultValues) {
    formData.parentId = defaultValues.parentId
    formData.status = 1
    formData.type = defaultValues.type ?? 1
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await newAdminApi.postDocpalAclRole({
      name: formData.name,
      parentId: formData.parentId?.toString(),
      status: formData.status,
      type: formData.type
    })
    
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('Failed to create role:', error)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

defineExpose({
  open
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 
