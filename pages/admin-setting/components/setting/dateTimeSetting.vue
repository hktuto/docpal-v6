<script lang="ts" setup>
import { newAdminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const FormRendererRef = ref()

const dateFormat = ref('')
const dateFormatOption = ref([
  {
    'label': 'YYYY-MM-DD',
    'value': 'YYYY-MM-DD'
  },
  {
    'label': 'YYYY/MM/DD',
    'value': 'YYYY/MM/DD'
  },
  {
    'label': 'MM/DD/YYYY',
    'value': 'MM/DD/YYYY'
  },
  {
    'value': 'DD/MM/YYYY',
    'label': 'DD/MM/YYYY'
  },
  {
    'value': 'YYYY-MM-DD HH:mm',
    'label': 'YYYY-MM-DD HH:mm'
  }
])
const systemId = ref('system_default_setting')

async function getMySetting() {
  const data = await newAdminApi.getDmsSettingSystemSystemid(systemId.value).then(r => r.data)
  if (!data) return
  dateFormat.value = data.metaDateFormat
}

async function handleSuccess(newValue: string) {
  await newAdminApi.putDmsSettingSystemSystemid(systemId.value, { metaDateFormat: newValue }).then(r => r.data)

  routerProvider?.message.success(t('dpMsg_success'))
  const bus = useEventBus<string>(EventType.USER_PREFERENCE_CHANGE__TIME)
  bus.emit(newValue)
}

onMounted(async () => {
  await getMySetting()
})

watch(() => dateFormat.value, (newValue, oldValue) => {
  if (oldValue !== '' && newValue !== oldValue) {
    handleSuccess(newValue)
  }
})
</script>

<template>
  <div class="cardCaontainer">
    <h2>{{ t('admin.setting.title') }}</h2>
    <div style="width: 200px; height: 100px">
      <el-form>
        <el-form-item label-position="top" :label="t('date_format')">
          <el-select v-model="dateFormat" :placeholder="t('date_format')">
            <el-option v-for="item in dateFormatOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>