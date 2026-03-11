<script lang="ts" setup>
import { clientApi } from 'api'

const { projects, projectsPermissions, isCreator } = useScanClient()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const loading = ref(false)

// Filter projects to only show those where user has creator permission
const creatableProjects = computed(() => {
  return projects.value.filter((project) => isCreator(project.id))
})

const isDisable = computed(() => {
  return creatableProjects.value.length === 0 || loading.value
})

async function handleCommand(projectId: string) {
  if (!projectId) return
  
  loading.value = true
  try {
    // Create draft batch via API
    const response = await clientApi.api.postCaptureBatchDraft({ projectId })
    
    if (response.result && response.data) {
      const draftBatch = response.data
      // Navigate to new batch page with draft batch data
      const tab = createNewBatchPageTab(draftBatch)
      routerProvider?.navigateTo(tab)
    } else {
      routerProvider?.message.error(response.message || 'Failed to create draft batch')
    }
  } catch (error) {
    console.error('Failed to create draft batch:', error)
    routerProvider?.message.error('Failed to create draft batch')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ElDropdown :disabled="isDisable" placement="bottom" @command="handleCommand">
    <span class="cursor-pointer">
      <ElButton :type="isDisable ? 'info' : 'primary'" :loading="loading">
        <Icon name="lucide:plus" />
        New Batch
      </ElButton>
    </span>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="project in creatableProjects" :key="project.id" :command="project.id">
          {{ project.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
