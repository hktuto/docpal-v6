<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    class="create-workspace-form"
  >
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
      <div style="display: flex; gap: var(--app-space-xs);">
        <ElButton type="primary" @click="handleCreateWorkspace" :loading="loading">Create Database</ElButton>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { CaseTypeRecord } from '../../utils/db/schema/newTableSchema'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const { query } = usePglite()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = ref({
  name: '',
  description: '',
  icon: '',
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please enter Database name', trigger: 'blur' }
  ]
})

const emits = defineEmits<{
  (e: 'created', workspace: CaseTypeRecord): void
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
    
    // Check if name already exists
    const existing = await query(`SELECT id FROM case_type WHERE name = $1`, [name])
    if (existing && existing.length > 0) {
      ElMessage.error('Database name already exists')
      return
    }

    // Create workspace - let database handle id (defaultRandom) and timestamps (defaultNow)
    const result = await query<CaseTypeRecord>(
      `INSERT INTO case_type (name, description, icon) VALUES ($1, $2, $3) RETURNING *`, 
      [name, description || null, icon || null]
    )
    
    console.log('Created workspace:', result[0])
    ElMessage.success('Database created successfully')
    emits('created', result[0])
    
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
