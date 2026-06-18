<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.unit')">
      <el-input v-model="formData.symbol" />
    </el-form-item>
    <el-row :gutter="10">
      <el-col :span="8">
        <el-form-item :label="t('mdTable.addColumnField.symbolAlign')">
          <el-select v-model="formData.symbolAlign" :placeholder="t('mdTable.addColumnField.selectSymbolAlign')">
            <el-option :label="t('mdTable.addColumnField.alignLeft')" value="left" />
            <el-option :label="t('mdTable.addColumnField.alignRight')" value="right" />
            <el-option :label="t('mdTable.addColumnField.alignDefault')" value="default" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="16">
        <el-form-item :label="t('mdTable.addColumnField.precision')">
          <el-select v-model="formData.precision" clearable :placeholder="t('mdTable.addColumnField.selectPrecision')">
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
    <el-form-item :label="t('mdTable.addColumnField.defaultValue')" prop="defaultValue">
      <el-input-number v-model="formData.defaultValue" :min="formData.min" :max="formData.max" :step="1" />
    </el-form-item>
    <el-checkbox v-model="formData.showThouComma" :label="t('mdTable.addColumnField.showThousandSeparator')" />
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()
function getPrecisionOptions(value: number = 0) {
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
