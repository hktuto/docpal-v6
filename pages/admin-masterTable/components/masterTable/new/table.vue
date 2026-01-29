<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <div class="flex-x-start">
        <span v-if="!state.name" class="color--danger">
          {{ $t('masterTable.emptyName') }}
        </span>
        {{ state.name }}
        <Icon name="material-symbols:edit-square" class="normal cursor-pointer" @click="tableDialogRef.handleOpen({ name: state.name })"></Icon>
      </div>
      <div class="flex-x-center">
        <el-dropdown id="MasterTable__Tables__CreateNewMasterTable__AddColumn">
          <el-button class="el-icon--left"> {{ $t('masterTable.newSchema') }}</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in state.dataTypeList" :key="item.value" @click="handleSingleSchemaAdd(item)">
                {{ $t(`marsterTable.type.${item.value}`) }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button id="MasterTable__Tables__CreateNewMasterTable__Submit" type="primary" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
    <template #columnName="{ row }">
      <div class="masterTable-columnName">
        <span>{{ row.fieldName }}</span>
        <div v-if="row.unique && !isDefault(row)" class="column-dynamic" style="--column-color: #0099ff">
          <div class="column-dynamic-point"></div>
          {{ $t('marsterTable.unique') }}
        </div>
        <div v-else-if="row.required && !isDefault(row)" class="column-dynamic" style="--column-color: #7b61ff">
          <div class="column-dynamic-point"></div>
          {{ $t('marsterTable.required') }}
        </div>
      </div>
    </template>
    <template #more="{ row }">
      <Icon v-if="!isDefault(row)" class="closeIcon cursorPointer" name="ic:round-close" @click.stop="handleDelete(row)"></Icon>
    </template>
    <template #dataType="{ row }">
      {{ row.dataType === 'varchar' && row.length === 4000 ? $t(`marsterTable.type.${row.dataType}:${row.length}`) : $t(`marsterTable.type.${row.dataType}`) }}
      <template v-if="row.relationTable">
        -
        <el-tag round> {{ row.relationTable }}</el-tag>
        -
        <el-tag round> {{ row.relationField }}</el-tag>
        <!-- - <el-tag> {{ row.displayField }}</el-tag> -->
      </template>
    </template>
  </VxeGrid>
  <MasterTableDialog ref="tableDialogRef" @confirm="({ name }) => (state.name = name)"></MasterTableDialog>
  <MasterTableNewSchemaDialog ref="schemaDialogRef" disabledUniqueList="" @add="handleAddSchama" @update="handleUpdateSchama" />
</template>
<script lang="ts" setup>
import { MenuRouterKey } from '#imports'
import { getIgnoreSchemas } from '~/utils/masterTableProvider'
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const { t } = useI18n()
const ignoreList = getIgnoreSchemas()
const routerProvider = inject(MenuRouterKey)

const state = reactive<any>({
  name: '',
  dataTypeList: []
})

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'masterTableTableSetting',
  columns: [
    {
      field: 'fieldName',
      title: 'masterTable.columnName',
      fixed: 'left',
      slots: {
        default: 'columnName'
      }
    },
    {
      field: 'dataType',
      title: 'masterTable.dataType',
      slots: {
        default: 'dataType'
      }
    },
    {
      title: 'dpTable_actions',
      field: 'more',
      slots: {
        default: 'more'
      }
    }
  ],
  height: 'auto',
  optionalConfig: {
    data: [
      { dataType: 'timestamp', fieldName: 'created_date', required: true, unique: false },
      {
        dataType: 'varchar:255',
        fieldName: 'id',
        primaryKey: true,
        required: true,
        unique: true
      },
      {
        dataType: 'timestamp',
        fieldName: 'modified_date',
        required: true,
        unique: false
      },
      {
        dataType: 'varchar:255',
        fieldName: 'modified_by',
        required: true,
        unique: false
      },
      { dataType: 'varchar:255', fieldName: 'created_by', required: true, unique: false },
      { dataType: 'boolean', fieldName: 'status', required: true, unique: false }
    ]
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  if (!isDefault(row)) {
    state.curRow = row
    checkDisabledUniqueAndOpenSchemaDialog(row, true)
  }
}

function isDefault(row: any) {
  return ignoreList.includes(row.fieldName)
}

const tableDialogRef = ref()
const schemaDialogRef = ref()

function handleSingleSchemaAdd(row: any) {
  schemaDialogRef.value.handleOpen({ unique: row.unique, dataType: row.value }, { disabledUnique: !row.unique })
}

async function handleSubmit() {
  if (!state.name) {
    tableDialogRef.value.handleOpen()
    return
  }
  if (tableConfig.data.length === 6) {
    routerProvider?.message.error(t('tip.masterTable.noValidData'))
    handleSingleSchemaAdd(state.dataTypeList[0])
    return
  }
  try {
    const data = await clientApi.admin.postAdmindmsMasterTable({
      name: state.name,
      fields: tableConfig.data
    }).then(r => r.data)
    routerProvider?.navigateTo(routeMasterTableDetail(data))
  } catch (error) {
    console.log(error)
  }
}

function checkDisabledUniqueAndOpenSchemaDialog(row: any, edit: boolean = false) {
  const dataType = state.dataTypeList.find((item: any) => item.value === row.dataType)
  schemaDialogRef.value.handleOpen(row, { edit, disabledUnique: !dataType.unique })
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('msg_confirmWhetherToDelete'))
    if (action !== 'confirm') return
    const index = tableConfig.data.findIndex((item: any) => item.fieldName === row.fieldName)
    tableConfig.data.splice(index, 1)
  } catch (error) {
    console.error(error)
  }
}

function handleAddSchama(schema: any) {
  const index = tableConfig.data.findIndex((item: any) => item.fieldName === schema.fieldName)
  if (index !== -1) {
    routerProvider?.message.error(t('tip.duplicate'))
    setTimeout(() => {
      checkDisabledUniqueAndOpenSchemaDialog(schema)
    }, 1000)
  } else {
    routerProvider?.message.success(
      t('masterTable_createAddColumnSuccessMsg', {
        columnName: schema.fieldName,
        masterName: state.name
      })
    )
    tableConfig.data.push({ ...schema, label: schema.fieldName })
  }
}

function handleUpdateSchama(schema: any) {
  // state.curRow = schema;
  const curIndex = tableConfig.data.findIndex((item: any) => item.fieldName === state.curRow.fieldName)
  const duplicateIndex = tableConfig.data.findIndex((item: any, index: number) => item.fieldName === schema.fieldName && index !== curIndex)
  if (duplicateIndex !== -1) {
    routerProvider?.message.error(t('tip.duplicate'))
    setTimeout(() => {
      checkDisabledUniqueAndOpenSchemaDialog(schema, true)
    }, 1000)
  } else {
    tableConfig.data.splice(curIndex, 1, schema)
    tableRef.value?.loadData(tableConfig.data)
  }
}

onMounted(async () => {
  const res = await clientApi.admin.getAdmindmsMasterTableDatatypeMapping()
  state.dataTypeList = res.data
  state.dataTypeList.push({
    value: 'relation',
    label: t(`marsterTable.type.relation`),
    unique: false
  })
})
</script>
<style lang="scss" scoped></style>
