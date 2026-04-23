<script setup lang="ts">
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { element } = defineProps<{
  element: any
}>()
const { getVariablesByType } = useVariablesProvide()
const allVariables = computed(() => {
  return getVariablesByType([])
})
const typeOptions = computed(() => {
  return []
})
const conditionOption = computed(() => {
  return []
})

function typeChange() {

}

</script>

<template>
  <div class="elementContainer">
    <div v-if="!graphProvider.readonly.value" class="removeConditionContainer">
      <Icon name="lucide:trash" @click="$emit('delete')" />
    </div>
    <el-form>
      <el-form-item label="Field" prop="id">
        <el-select v-model="form.id" placeholder="Select form field" :disabled="graphProvider.readonly.value" filterable clearable>
          <el-option v-for="item in allVariables" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="form.type" placeholder="Select form field" :disabled="graphProvider.readonly.value" filterable clearable @change="typeChange">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Condition" prop="condition">
        <el-select v-model="form.condition" placeholder="Select form field" :disabled="graphProvider.readonly.value" filterable clearable>
          <el-option v-for="condition in conditionOption" :key="condition.value" :label="condition.label" :value="condition.value"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.elementContainer {
  width: 100%;
  position: relative;
}
</style>
