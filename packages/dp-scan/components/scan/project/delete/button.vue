<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
const prop = defineProps<{
  projectId: string
}>()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
async function deleteProject() {
  if (!prop.projectId) return
  ElMessageBox.alert('Are you sure you want to delete this batch?', '', {
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    type: 'warning',
    callback: async (action: string) => {
      if (action === 'cancel') return
      try {
        await clientApi.api.deleteCaptureProjId(prop.projectId)
        routerProvider?.message.success('Successfully Deleted Project')
        const tab = createProjectTableTab()
        routerProvider?.navigateTo(tab)
      } catch (error) {
        routerProvider?.message.error('Failed to Delete Project')
      }
    }
  })
}
</script>

<template>
  <ElButton type="warning" @click="deleteProject">Delete</ElButton>
</template>
