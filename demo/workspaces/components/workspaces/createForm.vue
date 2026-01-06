<template>
  <el-form label-position="top" class="create-workspace-form">
    <el-form-item label="Workspace Name">
      <el-input v-model="form.name" placeholder="Enter workspace name" />
    </el-form-item>
    <el-form-item label="Workspace Description">
      <el-input type="textarea" v-model="form.description" placeholder="Enter workspace description" />
    </el-form-item>
    <el-form-item label="Workspace Icon">
      <UiIconPicker v-model="form.icon" />
    </el-form-item>
    <el-form-item>
      <div style="display: flex; gap: var(--app-space-xs);">
        <ElButton type="primary" @click="handleCreateWorkspace" :loading="loading">Create Workspace</ElButton>
        <ElButton type="success" @click="handleBatchInsert(100)" :loading="batchLoading">Generate 1000 Records</ElButton>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { v7 as uuidv7 } from 'uuid'
import type { MenuItem } from '../../utils/db/schema/workspaces'
import { ElMessage } from 'element-plus'

const { query } = usePglite()

const loading = ref(false)
const batchLoading = ref(false)
const form = ref({
  name: '',
  description: '',
  icon: '',
  menu: [] as MenuItem[]
})

const emits = defineEmits(['created'])

async function handleCreateWorkspace() {
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
    const now = new Date().toISOString()
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

async function handleBatchInsert(batchCount: number = 1000) {
  batchLoading.value = true
  try {
    const icons = [
      'lucide:folder',
      'lucide:briefcase',
      'lucide:rocket',
      'lucide:star',
      'lucide:heart',
      'lucide:zap',
      'lucide:trophy',
      'lucide:target',
      'lucide:box',
      'lucide:package',
      'lucide:database',
      'lucide:globe',
      'lucide:compass',
      'lucide:layers',
      'lucide:cloud'
    ]
    
    const prefixes = [
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega',
      'Project', 'Team', 'Squad', 'Division', 'Unit',
      'Global', 'Regional', 'Local', 'Central', 'Core',
      'Digital', 'Creative', 'Tech', 'Innovation', 'Strategic'
    ]
    
    const types = [
      'Hub', 'Lab', 'Studio', 'Center', 'Space',
      'Workspace', 'Platform', 'Environment', 'Portal', 'Zone',
      'Sphere', 'Domain', 'Arena', 'Nexus', 'Base'
    ]
    
    const departments = [
      'Marketing', 'Sales', 'Engineering', 'Design', 'Operations',
      'Finance', 'HR', 'Product', 'Support', 'Analytics',
      'Research', 'Development', 'Strategy', 'Quality', 'Security'
    ]
    
    const descriptions = [
      'A workspace for managing projects',
      'Collaborative workspace for teams',
      'Personal workspace for individual tasks',
      'Workspace for client projects',
      'Internal team workspace',
      'Marketing and sales workspace',
      'Development and engineering workspace',
      'Design and creative workspace',
      'Operations and logistics workspace',
      'Finance and accounting workspace',
      'Research and innovation hub',
      'Strategic planning center',
      'Customer success platform',
      'Product development space',
      'Analytics and insights lab'
    ]

    const batchSize = 100
    const totalRecords = batchCount || 1000
    const batches = Math.ceil(totalRecords / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const values = []
      const placeholders = []
      let paramIndex = 1

      const recordsInBatch = Math.min(batchSize, totalRecords - batch * batchSize)

      for (let i = 0; i < recordsInBatch; i++) {
        const index = batch * batchSize + i
        const id = uuidv7()
        
        // Generate varied workspace names
        let name = ''
        const namePattern = index % 4
        if (namePattern === 0) {
          // Pattern: "Department Type"
          name = `${departments[index % departments.length]} ${types[index % types.length]}`
        } else if (namePattern === 1) {
          // Pattern: "Prefix Department"
          name = `${prefixes[index % prefixes.length]} ${departments[index % departments.length]}`
        } else if (namePattern === 2) {
          // Pattern: "Prefix Type Number"
          name = `${prefixes[index % prefixes.length]} ${types[index % types.length]} ${Math.floor(index / 4) + 1}`
        } else {
          // Pattern: "Department Prefix Type"
          name = `${departments[index % departments.length]} ${prefixes[index % prefixes.length]} ${types[index % types.length]}`
        }
        
        const slug = name.toLowerCase().replaceAll(' ', '-')
        const description = descriptions[index % descriptions.length]
        const icon = icons[index % icons.length]
        const menu: MenuItem[] = []
        const now = new Date().toISOString()

        placeholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
        )
        
        values.push(id, name, slug, description, icon, menu, now, now)
        paramIndex += 8
      }

      const insertQuery = `INSERT INTO workspaces (id, name, slug, description, icon, menu, created_at, updated_at) VALUES ${placeholders.join(', ')}`
      await query(insertQuery, values)
      
      ElMessage.info(`Inserted batch ${batch + 1}/${batches} (${(batch + 1) * batchSize} / ${totalRecords})`)
    }

    ElMessage.success('Successfully generated 1000 records!')
    emits('created')
  } catch (error) {
    console.error(error)
    ElMessage.error('Failed to batch insert records')
  } finally {
    batchLoading.value = false
  }
}
</script>
