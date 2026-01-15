<template>
  <div>
    <el-form-item label="最大值">
      <el-input v-model="formData.max" type="number" />
    </el-form-item>
    <el-form-item label="是否允许半星">
      <el-switch v-model="formData.allowHalf" />
    </el-form-item>
    <el-form-item label="Default Value">
      <el-rate v-model="formData.defaultValue" :max="formData.max" :allow-half="formData.allowHalf" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any
}>()
</script>
