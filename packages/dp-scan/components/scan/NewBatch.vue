<script lang="ts" setup>
const { projects } = useScanClient()

const isDisable = computed(() => {
  return !projects || projects.value.length === 0
})
</script>

<template>
  <ElDropdown :disabled="isDisable" placement="bottom">
    <span class="cursor-pointer">
      <ElButton :type="isDisable ? 'info' : 'primary'"> New Batch </ElButton>
    </span>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="project in projects" :key="project.id" @click="$emit('create', project)">
          {{ project.name }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>
