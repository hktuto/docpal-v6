<script lang="ts" setup>
const options = [
  { label: 'Import Project', value: 'import' },
  { label: 'Create Blank Project', value: 'blank' }
]
const blankDialogRef = ref()
const dropdownEl = ref()
const handleCommand = (command: string) => {
  console.log(command)
  if (command === 'blank') {
    const el = dropdownEl.value.$el
    blankDialogRef.value.open(el)
  }
}
</script>

<template>
  <ElDropdown ref="dropdownEl" @command="handleCommand">
    <ElButton type="primary">New Project</ElButton>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="option in options" :key="option.value" :command="option.value">
          {{ option.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
  <ScanProjectBlankDialog ref="blankDialogRef" />
</template>
