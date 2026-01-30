<script lang="ts" setup>
import type { CalendarOptions } from '#imports'
import { clientApi } from 'api'

const opened = ref(false)
const { t } = useI18n()
const emits = defineEmits(['submit', 'delete'])
const { setting } = defineProps<{
  setting?: any,
}>()
const {
  setting: calendarSetting,
  categoriesOption,
  locationsOption,
  calendarViewOptions,
  weekDayOptions
} = useCalendarStore()
const userFiterOptions = ref([])

async function getOptions() {
  const user =  await clientApi.api.postUcenterUsers({}).then((res) => res.data)
  userFiterOptions.value = user.map(item => {
    return {
      label: item.username,
      value: item.userId
    }
  })
  userFiterOptions.value.unshift({
    label: 'Current User',
    value: 'currentUser'
  })
}

const form = ref<CalendarOptions>({
  title: '',
  defaultNewEventCalendar: '',
  showUserFilter: false,
  showCategoryFilter: false,
  showLocationFilter: false,
  defaultUser: '',
  defaultCategory: '',
  defaultLocation: '',
  userLabel: '',
  categoryLabel: '',
  locationLabel: '',
  view: '',
  firstDayOfWeek: '',
  allowCreate: false
})

function handleOpen() {
  opened.value = true
  getOptions()
  Object.keys(setting).forEach(key => {
    if (setting[key]) {
      form.value[key] = setting[key]
    }
  })
  if (!form.value.view) {
    form.value.view = calendarSetting.value?.basic.default_view
  }
  if (!form.value.firstDayOfWeek) {
    form.value.firstDayOfWeek = calendarSetting.value?.basic.default_first_week
  }
}

function submit() {
  // editable is for workflow , so we need to force it to false
  // force editable to false
  emits('submit', form.value)
  opened.value = false
}

function handleShowFilter(filter: string) {
  switch (filter) {
    case 'User':
      if (!form.value.showUserFilter) {
        form.value.defaultUser = ''
        form.value.userLabel = ''
      }
      break
    case 'Category':
      if (!form.value.showCategoryFilter) {
        form.value.defaultCategory = ''
        form.value.categoryLabel = ''
      }
      break
    case 'Location':
      if (!form.value.showLocationFilter) {
        form.value.defaultLocation = ''
        form.value.locationLabel = ''
      }
      break
    default:
  }
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog v-model="opened" append-to-body :title="t('Calendar Widget Setting')">
    <el-form :model="form" label-position="top" @submit.stop="" show-close>
      <el-form-item :label="t('Title')">
        <el-input v-model="form.title" :placeholder="$t('vxe.base.pleaseInput')" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="t('Default New Event Calendar')">
        <el-select v-model="form.defaultNewEventCalendar" clearable :placeholder="$t('common_selectOccupancyContent')"
                   filterable>
          <el-option v-for="item in categoriesOption" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-divider />

      <ElFormItem label="Calendar View">
        <ElSelect v-model="form.view" placeholder="Default View" clearable>
          <ElOption v-for="item in calendarViewOptions" :key="item" :label="item" :value="item"></ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Week Day">
        <ElSelect v-model="form.firstDayOfWeek" placeholder="First Day of Week" clearable>
          <ElOption v-for="item in weekDayOptions" :key="item" :label="item" :value="item"></ElOption>
        </ElSelect>
      </ElFormItem>
      <el-divider />

      <el-form-item :label="t('Show User Filter')">
        <el-switch v-model="form.showUserFilter" active-text="Yes" inactive-text="No"
                   @change="handleShowFilter('User')" />
      </el-form-item>
      <el-form-item v-if="form.showUserFilter" :label="t('Default User')">
        <el-select v-model="form.defaultUser" clearable placeholder="Default User" filterable>
          <el-option v-for="item in userFiterOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.showUserFilter" :label="t('User Filter Title')">
        <el-input v-model="form.userLabel" :placeholder="$t('vxe.base.pleaseInput')" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="t('Show Category Filter')">
        <el-switch v-model="form.showCategoryFilter" active-text="Yes" inactive-text="No"
                   @change="handleShowFilter('Category')" />
      </el-form-item>
      <el-form-item v-if="form.showCategoryFilter" :label="t('Default Calendar Filter')">
        <el-select v-model="form.defaultCategory" clearable :placeholder="$t('common_selectOccupancyContent')"
                   filterable>
          <el-option v-for="item in categoriesOption" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.showCategoryFilter" :label="t('Category Filter Title')">
        <el-input v-model="form.categoryLabel" :placeholder="$t('vxe.base.pleaseInput')" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="t('Show Location Filter')">
        <el-switch v-model="form.showLocationFilter" active-text="Yes" inactive-text="No"
                   @change="handleShowFilter('Location')" />
      </el-form-item>
      <el-form-item v-if="form.showLocationFilter" :label="t('Default Location Filter')">
        <el-select v-model="form.defaultLocation" clearable :placeholder="$t('common_selectOccupancyContent')"
                   filterable>
          <el-option v-for="item in locationsOption" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.showLocationFilter" :label="t('Location Filter Title')">
        <el-input v-model="form.locationLabel" :placeholder="$t('vxe.base.pleaseInput')" />
      </el-form-item>
      <el-divider />

      <el-form-item :label="t('Allow Create')">
        <el-switch v-model="form.allowCreate" active-text="Yes" inactive-text="No" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button id="Home__Dashboard__Calendar__Settings__Cancel" @click="opened = false">
        {{ $t('vxe.button.cancel') }}
      </el-button>
      <el-button id="WorkPanel__Detail__Calendar__Settings__Delete" type="danger" @click="$emit('delete')">
        {{ $t('common_delete') }}
      </el-button>
      <el-button id="Home__Dashboard__Calendar__Settings__Confirm" type="primary" @click="submit">
        {{ $t('vxe.button.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
