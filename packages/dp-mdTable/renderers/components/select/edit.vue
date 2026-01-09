<script setup lang="ts">

  const props = defineProps<{
    options: {id: any, label: string, color: string}[],
    collapseTags: boolean,
    filterable: boolean,
    clearable: boolean,
    multiple: boolean,
    modelValue: any,
    popperClass?: string,
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
  }>()

  function getOption(id: any) {
    return props.options.find((option: any) => option.id === id)
  }

  const selectedOption = computed(() => {
    return props.options.find((option: any) => option.id === props.modelValue)
  })

  const handleChange = (value: any) => {
    emit('update:modelValue', value)
  }

</script>


<template>
  <ElSelect v-bind="props" @change="handleChange">
    <ElOption v-for="option in options" :key="option.id" :label="option.label" :value="option.id" >
      <span class="table-tag round" :style="{ '--color': option.color }"></span> <span class="table-tag-label">{{ option.label }}</span>
    </ElOption>
    <template #tag>
      <div class="table-tag-container">
        <span v-for="id in modelValue" :key="id" class="table-tag" :style="{ '--color': getOption(id)?.color }">{{ getOption(id)?.label }}</span> 
      </div>
    </template>
    <template #label>
      <span class="table-tag round" :style="{ '--color': selectedOption.color }"></span> <span class="table-tag-label">{{ selectedOption.label }}</span>
    </template>
  </ElSelect>
</template>
