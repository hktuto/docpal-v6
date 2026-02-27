<script setup lang="ts">
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { convertSiteEventToCalendarEvent } from '../../../../utils/calendarHelper'

dayjs.extend(utc)
const { t } = useI18n()
const { setting: calendarSetting, categoriesOption, locationsOption } = useCalendarStore()
const form = ref({
  category: '',
  user: '',
  location: '',
  dateRange: []
})
const eventDialogRef = ref()
const userFilterOptions = ref()
const options = ref({})

function formLocation(id: string) {
  const location = locationsOption.value.find((item: any) => item.id === id)
  return !!location ? location.name : ''
}

function formCategory(id: string) {
  const categories = categoriesOption.value.find((item: any) => item.id === id)
  return !!categories ? categories.name : ''
}

const { tableRef, tableConfig, tableEvent, reload } = useVxeTable({
  id: 'calendarEventManagement',
  zoom: false,
  api: async (params: any) => {
    return await getEventList({})
  },
  remoteSort: true,
  columns: [
    {
      title: 'dpTable_name',
      field: 'title',
      fixed: 'left'
    },
    {
      title: 'dpTable_location',
      field: 'detail.location',
      formatter({ cellValue }: any) {
        return formLocation(cellValue)
      }
    },
    {
      title: 'Category',
      field: 'detail.category',
      formatter({ cellValue }: any) {
        return formCategory(cellValue)
      }
    },
    {
      title: 'Description',
      field: 'detail.eventDescription'
    },
    {
      title: 'Participants',
      field: 'detail.relatedUsers.eventUser',
      formatter({ cellValue }: any) {
        // 給role and group id轉成name
        return cellValue
      }
    },
    {
      title: 'info_by',
      field: 'detail.createdBy'
    },
    {
      title: 'info_created',
      field: 'detail.createdDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        name: 'common_edit',
        action: ({ row }) => editEvent(row)
      }
    ]
  ]
})

async function getEventList(filterParams?: any) {
  const params: any = {
    startTime: filterParams.date?.startTime,
    endTime: filterParams.date?.endTime
  }
  try {
    const data = await newClientApi.postDmsCalendarsList(params).then(res => res.data)

    tableConfig.data = data.filter((event: any) => {
      if (!!filterParams.category) {
        const matCat = event.category === filterParams.category
        if (!matCat) return false
      }
      if (!!filterParams.location) {
        const matLoc = event.location === filterParams.location
        if (!matLoc) return false
      }
      if (!!filterParams.user) {
        const userFilter = event.user === filterParams.user
        const mapUser = event.assignee === userFilter || event.modifiedBy === userFilter
        const userInRelated = event.relatedUsers ? event.relatedUsers.user === userFilter : false
        if (!mapUser && !userInRelated) return false
      }
      return true
    }).map((ev) => convertSiteEventToCalendarEvent(ev)).sort((a, b) => {
      return new Date(b.detail.createdDate) - new Date(a.detail.createdDate)
    })
    reload()
  } catch (e) {
    console.log(e)
    throw e
  }
}

function createEvent() {
  eventDialogRef.value.createEvent()
}

function editEvent(row: any) {
  // TODO：應該在外層禁用事件
  if ('R' === row.detail.status || 'D' === row.detail.status) {
    return
  }
  eventDialogRef.value.editEvent(row)
}

watch(form, (newValue, oldValue) => {
  const filterParams: any = {
    date: {
      startTime: dayjs.utc(newValue.dateRange[0]).toISOString(),
      endTime: dayjs.utc(newValue.dateRange[1]).toISOString()
    },
    category: newValue.category,
    location: newValue.location,
    user: newValue.user
  }
  getEventList(filterParams)
}, { deep: true })

</script>

<template>
  <div style="height: 85vh">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <slot name="toolbar_buttons" />
        <div class="toolbar-container">
          <div class="filter-section">
            <el-form label-position="top" :inline="true">
              <el-formItem :label="t('Location')">
                <el-select v-model="form.location" clearable :placeholder="t('common_selectOccupancyContent')"
                           filterable>
                  <el-option v-for="item in locationsOption" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-formItem>
              <el-formItem :label="t('Category')">
                <el-select v-model="form.category" clearable :placeholder="t('common_selectOccupancyContent')"
                           filterable>
                  <el-option v-for="item in categoriesOption" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-formItem>
              <el-formItem :label="t('User')">
                <el-select v-model="form.user" clearable :placeholder="t('common_selectOccupancyContent')" filterable>
                  <el-option v-for="item in userFilterOptions" :key="item.value" :label="item.label"
                             :value="item.value" />
                </el-select>
              </el-formItem>
              <el-formItem :label="t('Date Range')">
                <el-date-picker v-model="form.dateRange" type="daterange" range-separator="To"
                                start-placeholder="Start Date" end-placeholder="End Date" />
              </el-formItem>
            </el-form>
          </div>
          <div class="button-section">
            <el-button size="large" type="primary" @click="createEvent">{{ $t('New Event') }}</el-button>
          </div>
        </div>
      </template>
    </VxeGrid>
  </div>

  <CalendarManagementUpdateEventDialog ref="eventDialogRef" :options="options" @reload="reload()" />
</template>

<style scoped lang="scss">
.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 20px;
}

.filter-section {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.button-section {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}
</style>
