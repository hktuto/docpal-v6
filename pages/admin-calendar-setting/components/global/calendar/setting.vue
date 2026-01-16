<script setup lang="ts">
import { clientApi } from 'api'
import { ElFormItem, ElSwitch } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw createError('menu manger not found')
}
const categoriesColumn = useCategoriesColumn()
const { t } = useI18n()
const { setting, getCalendarsSetting, calendarViewOptions, weekDayOptions } = useCalendarStore()
const loading = ref(false)

const saveSetting = useDebounceFn(async () => {
  await clientApi.api.postDmsCalendarsSetting(setting.value).then(r => r.data)
  routerProvider?.message.success(t('dpMsg_success'))
}, 500)


provide(CalendarSettingKey, {
  saveSetting
})

onMounted(() => {
  // getCalendarsSetting()
})

</script>

<template>
  <div class="pageContainer" v-loading="loading">
    <template v-if="setting">
      <div class="section basic">
        <div class="title">{{ $t('calendarSetting.basic') }}</div>
        <ElForm label-position="top" @submit.stop="">
          <ElRow :gutter="12">
            <ElCol :span="12">
              <ElFormItem :label="$t('calendarSetting.view')">
                <ElSelect v-model="setting.basic.default_view" @change="saveSetting">
                  <ElOption v-for="option in calendarViewOptions" :key="option"
                            :label="$t(`calendarSetting.viewOption.${option}`)" :value="option" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem :label="$t('calendarSetting.firstOfWeek')">
                <ElSelect v-model="setting.basic.default_first_week" @change="saveSetting">
                  <ElOption v-for="option in weekDayOptions" :key="option"
                            :label="$t(`calendarSetting.weekOption.${option}`)" :value="option" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('calendarSetting.defaultSolt')">
                <el-select v-model="setting.basic.default_slot" @change="saveSetting">
                  <el-option value="15">15</el-option>
                  <el-option value="30">30</el-option>
                  <el-option value="60">60</el-option>
                  <template #prefix>
                    {{ $t('time.minutes') }}
                  </template>
                </el-select>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('calendarSetting.allowCustomSlot')">
                <ElSwitch v-model="setting.basic.allow_custom_slot" active-text="Allow" inactive-text="Disallow"
                          @change="saveSetting" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('calendarSetting.officeStartTime')">
                <ElTimePicker v-model="setting.basic.office_start_time" placeholder="Select date and time"
                              format="HH:mm" value-format="HH:mm" @change="saveSetting" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">

              <ElFormItem :label="$t('calendarSetting.officeEndTime')">
                <ElTimePicker v-model="setting.basic.office_end_time" placeholder="Select date and time" format="HH:mm"
                              value-format="HH:mm" @change="saveSetting" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
      </div>
      <div class="section location">
        <div class="title">{{ $t('calendarSetting.location') }}</div>
        <ElForm label-position="top" @submit.stop="">
          <ElRow :gutter="12">
            <ElCol :span="8">
              <ElFormItem :label="$t('calendarSetting.location_masterTable')">
                <ElSelect v-model="setting.location.master_table" @change="saveSetting" disabled>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('calendarSetting.allowCustom')">
                <ElSwitch v-model="setting.location.allow_custom" active-text="Allow" inactive-text="Disallow"
                          @change="saveSetting" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('calendarSetting.allowEmpty')">
                <ElSwitch v-model="setting.location.allow_empty" active-text="Allow" inactive-text="Disallow"
                          @change="saveSetting" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
      </div>
      <CalendarSettingCategories />
      <el-divider />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  overflow: auto;
}

.section + .section {
  border-top: 1px solid var(--app-grey-800);
}

.section {
  width: 100%;
  padding-block: var(--app-space-s);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);

  .title {
    font-size: var(--app-font-size-l);
    font-weight: bold;
    color: var(--app-grey-200);
  }

  :deep(.el-form) {
    width: 100%;
  }
}
</style>
