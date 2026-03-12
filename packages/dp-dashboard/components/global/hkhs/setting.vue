<script setup lang="ts">
import { newClientApi } from 'api'

const emits = defineEmits(['submit'])
const { setting } = defineProps<{
  setting?: any
}>()
const { t } = useI18n()
const opened = ref(false)

const form = ref({
  name: '',
  project: []
})
const FormRef = ref()
const projectList = ref<any[]>([])

async function handleOpen() {
  projectList.value = (await newClientApi.postCaptureProjPage({}).then((r) => r.data)) as any[]
  opened.value = true
  Object.keys(setting).forEach((key) => {
    if (setting[key]) {
      form.value[key] = setting[key]
    }
  })
}

function submit() {
  emits('submit', form.value)
  opened.value = false
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog :title="t('Setting')" v-model="opened">
    <el-form label-position="top" ref="FormRef" :model="form">
      <el-form-item label="Widget Label">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Available Project">
        <el-select v-model="form.project" multiple collapse-tags collapse-tags-tooltip :placeholder="t('common_selectedIsMultiSelectRequiredMsg')">
          <el-option v-for="item in projectList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="Home__Dashboard__HKHS__Settings__Cancel" @click="opened = false">
        {{ $t('vxe.button.cancel') }}
      </el-button>
      <el-button id="Home__Dashboard__HKHS__Settings__Confirm" type="primary" @click="submit">
        {{ $t('vxe.button.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
