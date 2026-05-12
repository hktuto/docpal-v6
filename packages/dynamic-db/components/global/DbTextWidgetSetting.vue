<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="420px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Content (Markdown supported)">
        <el-input v-model="form.content" type="textarea" :rows="6" placeholder="Enter text or markdown content..." />
      </el-form-item>

      <el-form-item label="Background Color">
        <el-color-picker v-model="form.bgColor" />
      </el-form-item>

      <el-form-item label="Text Color">
        <el-color-picker v-model="form.textColor" />
      </el-form-item>

      <el-form-item label="Font Size">
        <el-select-v2 v-model="form.fontSize" :options="fontSizeOptions" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="footer-grid">
        <el-button type="danger" @click="handleDelete">{{ $t('common_delete') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useWidgetSetting} from '../../composables/dashboard/useWidgetSetting'

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)

const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' }
]

const form = reactive({
  content: '',
  bgColor: '#ffffff',
  textColor: '#333333',
  fontSize: 'medium'
})

watch(
  () => visible.value,
  (isVisible) => {
    if (isVisible) {
      form.content = setting.value.content || ''
      form.bgColor = setting.value.bgColor || '#ffffff'
      form.textColor = setting.value.textColor || '#333333'
      form.fontSize = setting.value.fontSize || 'medium'
    }
  }
)

function handleSubmit() {
  baseSubmit({
    content: form.content,
    bgColor: form.bgColor,
    textColor: form.textColor,
    fontSize: form.fontSize
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.footer-grid {
  display: flex;
  justify-content: space-between;
}
</style>
