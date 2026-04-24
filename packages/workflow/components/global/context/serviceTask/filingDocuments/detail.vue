<script setup lang="ts">
const field = defineModel<any[]>('field', { required: true })
const props = defineProps<{
  folderCabinetItem: any
}>()
const emits = defineEmits(['update:fields', 'update:fieldData'])
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const activeName = ref('')
const { getVariablesByType } = useVariablesProvide()
const stringVariablesList = computed(() => {
  return getVariablesByType(['string'], true)
})
const fileVariablesList = computed(() => {
  return getVariablesByType(['string'])
})

function handleCheckBox(status: boolean, item: any) {
  const level = item.level
  const id = item.id
  const levelList: any = [level]
  const index = field.value.findIndex((i) => i.id === id)

  // 勾選時將全部上級勾選
  if (status) {
    // 遍歷上級
    for (let i = index; i >= 0; i--) {
      if (field.value[i].level < level && !levelList.includes(field.value[i].level)) {
        levelList.push(field.value[i].level)
        field.value[i].check = true
      }
    }
  } else {
    // 取消勾選，下級全部取消
    for (let i = index + 1; i < field.value.length; i++) {
      if (field.value[i].level <= level) {
        break
      }
      field.value[i].check = false
      // 解除數據綁定
      field.value[i].mapping.forEach((f: any) => {
        f.formProperty = undefined
      })
    }
  }

  const map = field.value
    .filter((i) => i.check)
    .map((item) => {
      const mapping = handleMapping(item.mapping)
      return {
        parentId: item.parentId,
        id: item.id,
        name: item.name,
        documentId: item.documentId || '',
        documentFileId: !item.isFolder ? item.documentFileId : '',
        mapping: mapping
      }
    })
  emits('update:fields', map)
}

function handleMapping(mapping: any) {
  const map = {}
  mapping.map((item: any) => {
    map[item.metadata as string] = item.formProperty || ''
  })
  return map
}

function fileFieldOption() {
  const set = new Set()
  // 將已使用的 field 加進 Set List 中
  field.value.forEach((treeItem: any) => {
    treeItem.mapping.forEach((f: any) => {
      if (!!f.formProperty && f.attr_formProperty !== '') {
        set.add(f.formProperty)
      }
    })
  })

  if (!!stringVariablesList.value) {
    return stringVariablesList.value.filter((item: any) => {
      let includeItem = true
      set.forEach((name) => {
        if (item.id === name) {
          includeItem = false
        }
      })
      return includeItem
    })
  }
  return []
}

function filterOption() {
  // Retrieve the used and currently selected option
  const set: any = []
  field.value.forEach((i: any) => {
    if (!i.isFolder) {
      set.push(i.documentId)
    }
  })

  // Exclude used options
  return stringVariablesList.value.filter((item: any) => {
    let includeItem = true
    set.forEach((name: string) => {
      if (item.id === name) {
        includeItem = false
      }
    })
    return includeItem
  })
}

function handleUpdateField(item: any) {
  if (item.check === true) {
    const mapping = handleMapping(item.mapping)
    const map = {
      parentId: item.parentId,
      id: item.id,
      name: item.name,
      documentId: item.documentId || '',
      documentFileId: !item.isFolder ? item.documentFileId : '',
      mapping: mapping
    }
    emits('update:fieldData', map)
  }
}

function getLabelList(labelRules: string) {
  return labelRules ? jsonParse(labelRules) : [{ dataType: 'string', metadata: 'fc:docTitle', noDelete: true }]
}

function jsonParse(str: any) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return str
  }
}
</script>

<template>
  <div class="cabinetDetailContainer">
    <el-collapse v-model="activeName">
      <el-collapse-item v-for="item in field" :key="item.id" :title="item.name" :name="item.id">
        <template #title>
          <div class="collapseTitleContainer">
            <div class="indentItem" v-for="i in item.level" :key="i"></div>
            <el-checkbox @click.stop :disabled="graphProvider.readonly.value" v-model="item.check" @change="(value: boolean) => handleCheckBox(value, item)" />
            <SvgIcon :src="item.isFolder ? '/icons/folder-general.svg' : '/icons/file-general.svg'" />
            {{ item.name }}
          </div>
        </template>
        <div class="fieldContainer">
          <div class="indentItem" v-for="i in item.level" :key="i" />
          <div style="width: 100%">
            <div class="content">
              <el-form label-position="top" @sumit.stop :disabled="!item.check">
                <el-form-item label="Document Id">
                  <el-select v-model="item.documentId" clearable filterable :disabled="graphProvider.readonly.value" @change="handleUpdateField(item)">
                    <el-option v-for="option in fileVariablesList" :key="option.id" :label="option.name" :value="option.id" />
                  </el-select>
                </el-form-item>
                <div v-if="!item.isFolder">
                  <el-form-item label="File">
                    <el-select v-model="item.documentFileId" filterable :disabled="graphProvider.readonly.value" @change="handleUpdateField(item)">
                      <el-option v-for="option in fileFieldOption()" :key="option.id" :label="option.name" :value="option.id" />
                    </el-select>
                  </el-form-item>
                  <el-divider />
                </div>

                <div>
                  {{ $t('Folder name rule') }}:
                  <template v-for="(i, index) in getLabelList(item.rule)" :key="index">
                    <el-tag v-if="i.metadata">{{ $t(i.metadata) }}</el-tag>
                    <template v-if="index !== getLabelList(item.rule).length - 1">-</template>
                  </template>
                </div>
                <el-form-item v-for="metaField in item.mapping" :key="metaField.metadata" :label="metaField.metadata">
                  <el-select v-model="metaField.formProperty" :disabled="graphProvider.readonly.value" clearable filterable @change="handleUpdateField(item)">
                    <el-option v-for="option in filterOption()" :key="option.id" :label="option.name" :value="option.id" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped lang="scss">
.indentItem {
  width: var(--app-space-s);
  height: 100px;
  border-left: 1px solid var(--app-grey-800);
}

.collapseTitleContainer {
  --icon-size: 12px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: calc(var(--app-space-xs) / 2);

  .indentItem {
    height: 48px;
  }
}

.fieldContainer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: calc(var(--app-space-xs) / 2);
  width: 100%;
  background-color: #f9f7f7;

  .content {
    flex: 1 0 auto;
  }

  .fieldMappingItemContainer {
    width: 100%;
  }
}

.fieldMappingItemContainer + .fieldMappingItemContainer {
  border-top: 1px solid var(--app-grey-800);
}

.mappingTitle {
  font-size: 1rem;
  font-weight: 600;
}
</style>
