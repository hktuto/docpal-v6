<template>
  <div>
    <div class="subTitle"> {{ $t('collections_caption') }}</div>
    <el-select
      v-model="selected"
      value-key="id"
      filterable
      allow-create
      default-first-option
      clearable
      :reserve-keyword="false"
      :placeholder="$t('tip.selectHere')"
      class="collectionSelect"
    >
      <el-option
        v-for="item in myCollection"
        :key="item.id"
        :label="item.name"
        :value="item"
        :disabled="item.disabled"
      >
      </el-option>
    </el-select>
    <div class="footer">
      <el-button
        :id="`Browse__Info__AddToCollections__${selected ? !selected.id ? 'CreatNewCollection' : 'Confirm' : 'Select' }`"
        type="primary" @click="handleConfirm" :disabled="!selected">
        {{
          selected ? !selected.id ? $t('collections_new') : $t('dpButtom_confirm') : $t('designer.widgetLabel.select')
        }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{
  doc: any,
  exitList: any
}>()
const emit = defineEmits(['handleAdd'])
const allCollection = ref([])
const popoverShow = ref(false)

const selected = ref()
const myCollection = computed(() => {
  return allCollection.value.reduce((prev: any, item: any) => {
    if (item.name) prev.push({
      ...item,
      disabled: props.exitList.findIndex((eItem: any) => eItem.name === item.name) !== -1
    })
    return prev
  }, []).sort((a, b) => (a.name.localeCompare(b.name)))
})

const handleConfirm = async () => {
  const collection = await handleGetCollection()
  if (!selected.value || !collection) {
    return
  }
  const param = {
    documents: [{ idOrPath: props.doc.id }],
    collection: { idOrPath: collection.id }
  }
  clientApi.api.postNuxeoCollectionAdd(param).then((res) => {
    selected.value = ''
    if (!res) return
    emit('handleAdd', props.doc.id)
  })
}

const handleGetCollection = async () => {
  const index = myCollection.value.findIndex((item) =>
    item.id === selected.value.id
  )
  if (index !== -1) {
    return myCollection.value[index]
  }
  const newCollection = await clientApi.api.postDmsCollection({ name: selected.value }).then(res => res.data)
  await getCollection()
  if (!!newCollection) {
    allCollection.value.push(newCollection)
  }
  return newCollection
}

async function querySearchAsync(queryString, cb) {
  let result = [...allCollection.value]
  // 过滤已存在的tag
  if (props.exitList) {

    result = result.filter((allItem: any) =>
      !props.exitList.some((exitItem: any) => exitItem.label === allItem))
  }
  // 加上value
  result = result.reduce((tags, item) => {
    tags.push({ value: item })
    return tags
  }, [])

  cb(result)
}

async function getCollection() {
  try {
    const res = await clientApi.api.getNuxeoCollection().then(res => res.data) as any
    allCollection.value = res.entryList
  } catch (error) {
    allCollection.value = []
  }
}

onMounted(async () => {
  getCollection()
})
</script>


<style lang="scss">
.collectionSelect {
  width: 100%;
}

.footer {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
