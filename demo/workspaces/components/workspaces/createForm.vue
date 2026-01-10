<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    class="create-workspace-form"
  >
    <el-form-item label="Workspace Name" prop="name">
      <el-input v-model="form.name" placeholder="Enter workspace name" />
    </el-form-item>
    <el-form-item label="Workspace Description" prop="description">
      <el-input type="textarea" v-model="form.description" placeholder="Enter workspace description" />
    </el-form-item>
    <el-form-item label="Workspace Icon" prop="icon">
      <UiIconPicker v-model="form.icon" />
    </el-form-item>
    <el-form-item>
      <div style="display: flex; gap: var(--app-space-xs);">
        <ElButton type="primary" @click="handleCreateWorkspace" :loading="loading">Create Workspace</ElButton>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { v7 as uuidv7 } from 'uuid'
import type { MenuItem } from '../../utils/db/schema/workspaces'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const { query } = usePglite()

const formRef = ref<FormInstance>()
const loading = ref(false)
const batchLoading = ref(false)
const form = ref({
  name: '',
  description: '',
  icon: '',
  menu: [] as MenuItem[]
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please enter workspace name', trigger: 'blur' }
  ]
})

const emits = defineEmits(['created'])

async function handleCreateWorkspace() {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const realFrom = JSON.parse(JSON.stringify(form.value))
    realFrom.name.trim()
    realFrom.icon.trim()
    // check if name is already exists
    const workspace = await query(`SELECT * FROM workspaces WHERE name = $1`, [realFrom.name])
    if (workspace && workspace.length > 0) {
      ElMessage.error('Workspace name already exists')
      return
    }
    // generate slug from name
    let slug = realFrom.name.toLowerCase().replaceAll(' ', '-')
    // check if slug is already exists
    const slugExists = await query(`SELECT * FROM workspaces WHERE slug = $1`, [slug])
    if (slugExists && slugExists.length > 0) {
      // get all slug start with slug
      const slugStartsWith = await query(`SELECT * FROM workspaces WHERE slug LIKE $1`, [slug + '%'])
      if (slugStartsWith && slugStartsWith.length > 0) {
        // get the last slug
        const lastSlug = slugStartsWith[slugStartsWith.length - 1].slug
        // increment the slug
        slug = lastSlug + 1
      }
    }
    // make the object pure 
    const newId = uuidv7()
    const now = Date.now()
    // create workspace with createdAt and updatedAt
    await query(
      `INSERT INTO workspaces (id, name, slug, description, icon, menu, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, 
      [newId, realFrom.name, slug, realFrom.description, realFrom.icon, realFrom.menu, now, now]
    )
    ElMessage.success('Workspace created successfully')
    emits('created')
  } catch (error) {
    console.error(error)
    ElMessage.error('Failed to create workspace')
  } finally {
    loading.value = false
  }
}

</script>
