<template>
  <el-card>
    <h3 class="title">{{ $t('easyForm.formSetting') }}</h3>
    <el-form ref="FormRef" label-position="top" :model="form" @submit.prevent>
      <el-formItem :label="$t('easyForm.name')" prop="name" :rules="[{ required: true, message: $t('easyForm.name') + $t('render.hint.fieldRequired') }]">
        <el-input v-model="form.name" @change="handleChange" :placeholder="$t('tip.input')" />
      </el-formItem>
    </el-form>
    <el-button id="EasyForm__Detail__FormSetting__Publish" :loading="state.publishLoading" type="primary" @click="handlePublish">
      {{ $t('button.publish') }}
    </el-button>
  </el-card>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const props = defineProps(['detail'])
const emits = defineEmits(['refresh'])
const { t } = useI18n()
const route = useRoute()
const state = reactive<any>({
  publishLoading: false
})
const form = ref({
  name: ''
})
const FormRef = ref()

async function handleChange(value: string) {
  try {
    if (value === props.detail.name) return
    form.value.name = value
    await newAdminApi.patchDmsEasyFormName({
      id: props.detail.id,
      name: value
    })
    props.detail.name = value
    console.log('??????????????', routerProvider)

    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
    form.value.name = props.detail.name
    routerProvider?.message.error(`${t('dpMsg_error')}`)
  }
}

async function handlePublish() {
  try {
    state.publishLoading = true
    await newAdminApi.postDmsEasyFormPublish({ id: props.detail.id }).then(r => r.data)
    routerProvider?.message.success(t('dpMsg_success'))
    emits('refresh')
  } catch (error) {
    console.log(error)
  } finally {
    state.publishLoading = false
  }
}

watch(() => props.detail, (newValue, oldValue) => {
  if (!!oldValue && oldValue.name === newValue.name) return
  if (!!newValue) form.value.name = newValue.name
}, {
  immediate: true
})
</script>
<style lang="scss" scoped>
.el-button {
  width: 100%;
}
</style>
