<template>
  <div class="infoSection">
    <div class="infoTitle">
      {{ $t('rightDetail_collection') }}
    </div>
    <div class="infoContent">
      <div v-for="(item) in collections" :key="item.id" class="tag">
        <div class="label">{{ item.name }}</div>
        <SvgIcon v-if="RbacAllowTo('editMetadata', doc)" :src="'/icons/close.svg'"
                 class="deleteIcon" @click="handleDelete(item)"/>
      </div>
      <div v-if="doc.status !== 20" class="addTagButton">
        <SvgIcon :src="'/icons/add.svg'" @click="handleAddCollection"/>
      </div>
    </div>
    <ElDialog v-model="dialogVisible" :title="$t('collections_add')" destroy-on-close append-to-body show-close
              :close-on-click-modal="false">
      <BrowseInfoCollectionAdd :doc="doc" :exitList="collections"
                               @handleAdd="() => {getCollection(); dialogVisible = false}"/>
    </ElDialog>
  </div>
</template>

<script lang="ts" setup>
import {ElMessageBox} from 'element-plus'
import {clientApi} from 'api'

const props = defineProps<{
  doc: any,
}>()
const {doc} = toRefs(props)
const {t} = useI18n()
const collections = ref([])
const dialogVisible = ref(false);

async function handleDelete(collection) {
  const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`, {
    confirmButtonText: `${t('dpButtom_confirm')}`,
    cancelButtonText: `${t('dpButtom_cancel')}`
  }).catch((action) => {
    return action
  })
  console.log(action)
  if (action !== 'confirm') return
  const index = collections.value.findIndex((item) => item.id === collection.id)

  const param = {
    documents: [{idOrPath: props.doc.id}],
    collection: {idOrPath: collection.id},
  }
  const res = await clientApi.api.deleteNuxeoCollectionRemove(param).then(res => res.data)
  await getCollection()
  if (!res) return
}

function handleAddCollection() {
  dialogVisible.value = true;
}

async function getCollection() {
  collections.value = await clientApi.api.postDmsDocumentCollections({idOrPath: doc.value.id}).then(res => res.data) as any
}

watch(
  doc,
  (val) => {
    if (val) {
      getCollection()
    }
  },
  {immediate: true}
)
</script>

<style lang="scss" scoped>
.collection {
  display: flex;
  flex-direction: column;
  // border-bottom: 1px solid var(--app-grey-200);
  .collectionTitle {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .title {
      font-style: normal;
      font-weight: normal;
      font-size: 1.125rem;
      line-height: 1.375rem;
      color: var(--app-grey-950);
    }
  }
}

.infoContent {
  display: flex !important;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.tag {
  border-radius: 4px;
  margin: calc(var(--app-space-xs) / 3) calc(var(--app-space-xs) / 2);
  background: var(--app-grey-900);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  padding: 4px 8px;
  --icon-size: 12px;

  .deleteIcon {
    margin-left: 4px;
    margin-top: 2px;
  }
}

.addTagButton {
  --icon-size: 20px;
}
</style>
