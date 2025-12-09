<script setup lang="ts">
import draggable from 'vuedraggable'
import { Edit, Delete, DeleteFilled } from '@element-plus/icons-vue'
import { adminApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const FormRef = ref()
const rules = reactive({
  label: [
    {
      required: true,
      message: t('render.hint.fieldRequired', { name: t('table_label') }),
      trigger: 'blur'
    }
  ]
})
const state = reactive<any>({
  visible: false,
  displayFieldList: [],
  systemFieldList: []
})
const editForm = reactive<any>({})

function cloneItem(el: any) {
  if (!state.displayFieldList.find((item: any) => item.key === el.key)) {
    const newItem = deepCopy(el)
    state.displayFieldList.push(newItem)
  }
}

function removeItem(el: any) {
  const index = state.displayFieldList.findIndex((item: any) => item.key === el.key)
  if (index !== -1) {
    state.displayFieldList.splice(index, 1)
  }
}

function openDialog(item: any) {
  Object.assign(editForm, item)
  state.visible = true
}

async function saveField() {
  try {
    await FormRef.value.validate()
  } catch (e) {
    return
  }

  const displayTarget = state.displayFieldList.find((item: any) => item.key === editForm.key)
  if (displayTarget) Object.assign(displayTarget, editForm)

  const systemTarget = state.systemFieldList.find((item: any) => item.key === editForm.key)
  if (systemTarget) Object.assign(systemTarget, editForm)

  state.visible = false
}

async function handleSubmit() {
  try {
    const newProperties = state.displayFieldList.reduce((acc: any, item: any, index: number) => {
      acc[item.key] = { ...item, sort: index }
      return acc
    }, {})

    await adminApi.api.putUserProfileSetting({ properties: newProperties }).then((res: any) => {
      if (res.code === 200) {
        routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: null, name: null }))
      }
    })
  } catch (e: any) {
    throw e
  }
}

async function init() {
  try {
    const systemFieldList: any = await adminApi.api.getUserSystemFields().then((res) => res.data)
    let { properties }: any = await adminApi.api.getUserProfileSetting().then((res) => res.data)
    if (!properties) {
      return
    }

    state.displayFieldList = Object.keys(properties)
      .map((key) => ({
        key,
        type: properties[key].type,
        readyOnly: properties[key].readyOnly,
        allowUserEdit: properties[key].allowUserEdit,
        display: properties[key].display,
        label: properties[key].label,
        sort: properties[key].sort ?? 0
      }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest)

    const exceptionList = ['SIGN']
    state.systemFieldList = systemFieldList.filter((item: any) => !exceptionList.includes(item.key))
  } catch (e: any) {
    throw e
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="card">
    <h3>{{ $t('user.setting.userProfileView') }}</h3>
    <el-divider />

    <el-row :gutter="30">
      <el-col :span="6">
        <h3>{{ $t('user.setting.displayField') }}</h3>
        <el-divider />

        <draggable class="dragArea list-group" :list="state.displayFieldList" group="people" item-key="id">
          <template #item="{ element }">
            <div class="list-group-item">
              <div class="field-row">
                <SvgIcon class="fa fa-align-justify" style="width: 12px" src="/icons/drag.svg" />
                <span style="font-weight: bold">{{ $t(`user.setting.${element.key}`) }}</span>

                <div class="icon-actions">
                  <svg
                    disabled="element.allowUserEdit"
                    @click="openDialog(element)"
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 256 256"
                  >
                    <path
                      fill="currentColor"
                      d="m232.49 55.51l-32-32a12 12 0 0 0-17 0l-96 96A12 12 0 0 0 84 128v32a12 12 0 0 0 12 12h32a12 12 0 0 0 8.49-3.51l96-96a12 12 0 0 0 0-16.98M192 49l15 15l-11 11l-15-15Zm-69 99h-15v-15l56-56l15 15Zm105-7.43V208a20 20 0 0 1-20 20H48a20 20 0 0 1-20-20V48a20 20 0 0 1 20-20h67.43a12 12 0 0 1 0 24H52v152h152v-63.43a12 12 0 0 1 24 0"
                    />
                  </svg>
                  <el-icon @click="removeItem(element)">
                    <DeleteFilled />
                  </el-icon>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </el-col>

      <el-col :span="6">
        <div class="header-row">
          <h3>{{ $t('user.setting.systemField') }}</h3>
          <span>{{ $t('Drag the fields you need to display to the left.') }}</span>
        </div>
        <el-divider />

        <draggable
          class="dragArea list-group"
          :list="state.systemFieldList"
          :group="{ name: 'people', pull: 'clone', put: false }"
          :clone="cloneItem"
          :sort="false"
          item-key="id"
        >
          <template #item="{ element }">
            <div class="list-group-item">
              <div class="field-row2">
                <span class="list-group-item" style="font-weight: bold">{{ $t(`user.setting.${element.key}`) }}</span>

                <div class="icon-actions">
                  <span style="font-size: 12px">{{ $t('user.setting.systemField') }}</span>
                  <!--                  <el-icon disabled="element.allowUserEdit">-->
                  <!--                    <Edit />-->
                  <!--                  </el-icon>-->
                  <!--                  <el-icon>-->
                  <!--                    <Delete />-->
                  <!--                  </el-icon>-->
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </el-col>
    </el-row>

    <el-button class="fixed-save-btn" id="UserProfileView__Save" type="primary" @click="handleSubmit">
      {{ $t('common_save') }}
    </el-button>
  </div>

  <el-dialog v-model="state.visible" :title="t('user.setting.editField')" width="600px">
    <el-form ref="FormRef" :model="editForm" :rules="rules" label-position="top">
      <el-form-item :label="t('table_label')" prop="label">
        <el-input v-model="editForm.label" />
      </el-form-item>
      <el-divider v-if="!editForm.readyOnly" />
      <el-form-item v-if="!editForm.readyOnly" :label="t('user.setting.allowUserEdit')">
        <el-switch v-model="editForm.allowUserEdit" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <ElButton id="UserProfileView__Dialog__Cancel" type="info" @click="state.visible = false">
          {{ $t('dpButtom_cancel') }}
        </ElButton>
        <ElButton id="UserProfileView__Dialog__Save" type="primary" @click="saveField">
          {{ $t('common_save') }}
        </ElButton>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.card {
  height: 100vh;
  box-sizing: border-box;
  min-width: 0;
  padding-top: 16px;
  padding-left: 16px;
  position: relative;
}

.handle {
  float: left;
  padding-top: 8px;
  padding-bottom: 8px;
  margin-right: 10px;
}

.field-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 2px;
}

.field-row2 {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
}

.icon-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fixed-save-btn {
  position: fixed;
  bottom: 16px;
}

.header-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 46px;
  position: relative;
}

.header-row span {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 12px;
  color: #666;
}
</style>
