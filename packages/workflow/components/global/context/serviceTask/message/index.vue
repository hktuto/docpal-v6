<script setup lang="ts">
const { getVariablesByType } = useVariablesProvide()

const { config } = defineProps<{
  config: {
    email: {
      method: string
      url: string
      headers: any
      to: string[]
      cc: string[]
      subject: string
      body: string
    }
    input_mapping: any
    output_mapping: any
  }
}>()
const emits = defineEmits(['update'])
const formData = ref()
const stringVariablesList = ref()

function init() {
  formData.value = deepCopy(config.email)
}

function update() {
  if (formData.value === config) return
  emits('update', {
    name: 'update-message-data',
    config: {
      email:formData.value,
      input_mapping: {},
      output_mapping: {}
    }
  })
}

watch(
  () => config,
  async () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(async () => {
  stringVariablesList.value = getVariablesByType(['string'], true)
})
</script>

<template>
  <el-form label-position="top">
    <el-form-item label="To">
      <el-select v-model="formData.to" filterable multiple @change="update">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="CC">
      <el-select v-model="formData.cc" filterable multiple clearable @change="update">
        <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item label="Subject">
      <el-input v-model="formData.subject" @blur="update" />
    </el-form-item>

    <el-form-item label="Body">
      <el-input v-model="formData.body" :autosize="{ minRows: 4, maxRows: 20 }" type="textarea" placeholder="Please input" @blur="update" />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
