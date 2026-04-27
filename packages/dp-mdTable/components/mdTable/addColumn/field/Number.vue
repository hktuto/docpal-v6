<template>
  <div>
    <el-form-item label="单位">
      <el-input v-model="formData.symbol" />
    </el-form-item>
    <el-row :gutter="10">
      <el-col :span="8">
        <el-form-item label="符号对齐方式">
          <el-select v-model="formData.symbolAlign" placeholder="请选择符号对齐方式">
            <el-option label="左对齐" value="left" />
            <el-option label="右对齐" value="right" />
            <el-option label="默认对齐" value="default" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="16">
        <el-form-item label="精度">
          <el-select v-model="formData.precision" placeholder="请选择精度">
            <template #label="{ label, value }">
              <div class="number-precision-option">
                <div v-show="formData.symbolAlign === 'left'">{{ formData.symbol }}</div>
                <div class="number-precision-option-text">
                  <template v-if="formData.symbolAlign === 'default'">{{ formData.symbol }}</template>
                  {{ getPrecisionOptions(value) }}
                </div>
                <div v-show="formData.symbolAlign === 'right'">{{ formData.symbol }}</div>
              </div>
            </template>
            <el-option v-for="i in 6" :key="i" :value="i" class="number-precision-option">
              <div v-show="formData.symbolAlign === 'left'">{{ formData.symbol }}</div>
              <div class="number-precision-option-text">
                <template v-if="formData.symbolAlign === 'default'">{{ formData.symbol }}</template>
                {{ getPrecisionOptions(i) }}
              </div>
              <div v-show="formData.symbolAlign === 'right'">{{ formData.symbol }}</div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="Default Value" prop="defaultValue">
      <el-input-number v-model="formData.defaultValue" :min="formData.min" :max="formData.max" :step="1" />
    </el-form-item>
    <el-checkbox v-model="formData.showThouComma" label="显示千分位" />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any
}>()
function getPrecisionOptions(value: number = 0) {
  console.log('getPrecisionOptions', value)
  const decimalPart = '0'.repeat(value)
  const _decimalPart = decimalPart.length > 0 ? '.' + decimalPart : ''
  const showThouComma = props.formData.showThouComma || false
  return showThouComma ? '1,000' + _decimalPart : '1' + _decimalPart
}
</script>
<style scoped lang="scss">
.number-precision-option {
  padding: 0 var(--app-space-s);
  display: flex;
  align-items: center;
  justify-content: space-between;
  .number-precision-option-text {
    width: 100%;
    text-align: right;
  }
}
</style>
