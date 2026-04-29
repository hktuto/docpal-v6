<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="create-workspace-form" @submit.prevent.stop="handleCreateWorkspace">
    <el-form-item label="Database Name" prop="name">
      <el-input v-model="form.name" placeholder="Enter Database name" />
    </el-form-item>
    <el-form-item label="Database Description" prop="description">
      <el-input type="textarea" v-model="form.description" placeholder="Enter Database description" />
    </el-form-item>
    <el-form-item label="Database Icon" prop="icon">
      <UiIconPicker v-model="form.icon" />
    </el-form-item>
    <el-form-item>
      <div style="display: flex; gap: var(--app-space-xs)">
        <ElButton type="primary" @click="handleCreateWorkspace" :loading="loading">Create Database</ElButton>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { DatabaseItem } from '../../utils/databaseType'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = ref({
  name: '',
  description: '',
  icon: ''
})

const { createDatabase } = useDatabases()
const rules = reactive<FormRules>({
  name: [{ required: true, message: 'Please enter Database name', trigger: 'blur' }]
})

const emits = defineEmits<{
  (e: 'created', workspace: DatabaseItem): void
}>()

async function handleCreateWorkspace() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const name = form.value.name.trim()
    const description = form.value.description.trim()
    const icon = form.value.icon.trim()
    const data: any = await createDatabase({ name, description, icon })
    if(!data || !data.id) {
      throw new Error('Failed to create database')
    }
    ElMessage.success('Database created successfully')
    emits('created', data)
    // Reset form
    form.value = { name: '', description: '', icon: '' }
  } catch (error) {
    console.error('Error creating workspace:', error)
    ElMessage.error('Failed to create database')
  } finally {
    loading.value = false
  }
}
</script>
