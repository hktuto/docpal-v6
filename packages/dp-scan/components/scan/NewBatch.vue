<script lang="ts" setup>
const { projects } = useScanClient()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const isDisable = computed(() => {
  return !projects.value || projects.value.length === 0
})

function handleCommand(command: string) {
  if (!command) return
  const tab = createNewBatchPageTab(command)
  routerProvider?.navigateTo(tab)
}
</script>

<template>
  <ElDropdown :disabled="isDisable" placement="bottom" @command="handleCommand">
    <span class="cursor-pointer">
      <ElButton :type="isDisable ? 'info' : 'primary'"> New Batch </ElButton>
    </span>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="project in projects" :key="project.id" :command="project.id">
          {{ project.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
