<template>
  <div>
    <el-form-item label="Icon for True">
      <UiIconPicker v-model="formData.icon" @change="handleIconChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
}>()

</script>
