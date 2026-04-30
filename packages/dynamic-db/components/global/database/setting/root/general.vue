<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'

const { database, saveWorkspaceToDb } = useSingleDatabaseContext()
const loading = ref(false)
const formData = ref({
  name: '',
  description: '',
  icon: ''
})

watch(
  database,
  (newWorkspace) => {
    if (newWorkspace) {
      formData.value.name = newWorkspace.name
      formData.value.description = newWorkspace.description || ''
      formData.value.icon = newWorkspace.icon || ''
    }
  },
  { immediate: true }
)

async function handleSaveGeneral() {
  if (!database.value) return

  try {
    loading.value = true
    await saveWorkspaceToDb({
      ...database.value,
      name: formData.value.name,
      description: formData.value.description,
      icon: formData.value.icon
    })
    ElMessage.success('Settings saved successfully')
  } catch (error) {
    console.error('Error saving database:', error)
    ElMessage.error('Failed to save settings')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="setting-section">
    <template #header>
      <div class="card-header">
        <h3>General</h3>
      </div>
    </template>
    <el-form :model="formData" label-position="top" class="setting-form">
      <el-form-item label="Database Name">
        <el-input v-model="formData.name" placeholder="Enter database name" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="Enter database description"
        />
      </el-form-item>

      <el-form-item label="Icon">
        <SvgIconSelector v-model:src="formData.icon" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSaveGeneral">
          Save Changes
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }
}

.setting-form {
  max-width: 600px;
}
</style>
