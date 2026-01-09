<script lang="ts" setup>
import { clientApi } from 'api'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { setting } = useCalendarStore()
let extraParams: any = {}
const remoteOption = await getPermissionPairOption()
const calendarProvider = inject(CalendarSettingKey)
const detailDialogRef = ref()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'calendarSetting_categories',
  api: (pageParams: any) => {
    return clientApi.api.getDmsCalendarsEventSettings({ eventCalendarSetting: {} }).then(r => r.data)
  },
  virtualScroll: true,
  pageSize: 5,
  columns: [
    {
      field: 'name',
      title: 'Name'
    },
    {
      field: 'permission.view',
      title: 'View',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'permission.update',
      title: 'Update',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'permission.create',
      title: 'Create',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'permission.cancel',
      title: 'Cancel',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'permission.remove',
      title: 'Remove',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'permission.export',
      title: 'Export',
      formatter({ cellValue }: any) {
        return setPermissionString(cellValue)
      }
    },
    {
      field: 'status',
      title: 'common_status'
    },
    {
      field: 'backgroundColor',
      title: 'Background Color',
      type: 'html',
      formatter: ({ cellValue }: string) => {
        return `<div style="display: flex;">
                <div style="width: 22px;height:22px;background-color:${cellValue};border: 1px solid #dcdfe6;flex-shrink: 0;"></div>
                <span>${cellValue}</span>
                </div>`
      }
    },
    {
      field: 'textColor',
      title: 'Text Color',
      type: 'html',
      formatter: ({ cellValue }: string) => {
        return `<div style="display: flex;">
                <div style="width: 22px;height:22px;background-color:${cellValue};border: 1px solid #dcdfe6;flex-shrink: 0;"></div>
                <span>${cellValue}</span>
                </div>`
      }
    },
    {
      field: 'highlightColor',
      title: 'Highlight Color',
      type: 'html',
      formatter: ({ cellValue }: string) => {
        return `<div style="display: flex;">
                <div style="width: 22px;height:22px;background-color:${cellValue};border: 1px solid #dcdfe6;flex-shrink: 0;"></div>
                <span>${cellValue}</span>
                </div>`
      }
    }
  ],
  bodyActions: [
    [{
      code: 'edit',
      name: 'common_edit',
      action: ({ row }: any) => {
        detailDialogRef.value.open(row)
      }
    },
      {
        code: 'delete',
        name: 'delete',
        action: async ({ row }: any) => {
          await clientApi.api.deleteDmsMasterTableIdRecord(setting.value.category.master_table, { recordId: row.id }, {})
          routerProvider?.message.success(t('tip_deleteSuccessMsg', {
            modelName: null,
            name: row.name
          }))
          reload()
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    detailDialogRef.value.open(row)
  }
})

function setPermissionString(cellValue: any) {
  const list = []
  for (const key in cellValue) {
    if (Array.isArray(cellValue[key]) && cellValue[key].length > 0 && remoteOption.length > 0) {
      switch (key) {
        case 'USERS':
          const userMap = cellValue[key].map(id => {
            const foundOption = remoteOption[0].options.find((opt: any) => opt.value === id)
            return foundOption ? foundOption.label : id
          })
          list.push(...userMap)
          break
        case 'ROLE':
          const roleMap = cellValue[key].map(id => {
            const foundOption = remoteOption[1].options.find((opt: any) => opt.value === id)
            return foundOption ? foundOption.label : id
          })
          list.push(...roleMap)
          break
        case 'GROUPS':
          const groupsMap = cellValue[key].map(id => {
            const foundOption = remoteOption[2].options.find((opt: any) => opt.value === id)
            return foundOption ? foundOption.label : id
          })
          list.push(...groupsMap)
          break
        default :
      }
    }
  }
  return list.toString()
}

function addRecord() {
  detailDialogRef.value.open()
}
</script>

<template>
  <div class="section category">
    <div class="title">{{ $t('calendarSetting.categories') }}</div>
    <div class="categoriesContainer" style="height: 450px">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <div class="actions">
            <ElButton id="CalendarSetting__EventLocations__EventCategories__Add" type="primary" @click="addRecord">
              {{ $t('Add') }}
            </ElButton>
          </div>
        </template>
      </VxeGrid>
    </div>
    <CalendarSettingCategoriesDetailDialog ref="detailDialogRef" @submit="reload" />
  </div>
</template>

<style lang="scss" scoped>
.category {
  width: 100%;
}

.categoriesContainer {
  width: 100%;
  height: 300px;
}

.actions {
  width: 20%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;
  --icon-size: var(--app-font-size-m);
}
</style>

