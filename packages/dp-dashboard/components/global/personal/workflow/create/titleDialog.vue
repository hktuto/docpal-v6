<script lang="ts" setup>
const emits = defineEmits(['refresh', 'delete'])
const { t } = useI18n()

const state = reactive({
  visible: false,
  setting: <
    {
      name: string
      title: string
      type: string
    }
  >{}
})
const predefineColors = ref(['#ffffff', '#ff4500', '#13c3ae', '#0bcf07', '#e6a23d', '#f56b6b', '#909298'])

async function handleSubmit() {
  emits('refresh')
  state.visible = false
}

function handleOpen(setting: any) {
  state.visible = true
  setTimeout(async () => {
    state.setting = setting
    if (!state.setting.type) {
      state.setting.type = '#13C3AEFF'
    }

    if (!setting.title) setting.title = setting.name
  })
}
function handleClear() {
  state.setting.type = '#ffffff'
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="Name">
        <el-input v-model="state.setting.name" disabled />
      </el-form-item>
      <el-form-item label="Title">
        <el-input v-model="state.setting.title" />
      </el-form-item>
      <el-form-item label="Button Color">
        <div class="color-preview-row">
          <el-color-picker v-model="state.setting.type" :predefine="predefineColors" @clear="handleClear" />
          <el-button :style="{ backgroundColor: state.setting.type, color: state.setting.type === '#ffffff' ? '#000' : '#fff' }">
            {{ $t('Preview Button Color') }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="footer-grid">
        <el-button id="WorkPanel__title__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.color-preview-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
