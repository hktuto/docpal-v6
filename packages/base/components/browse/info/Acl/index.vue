<template>
  <div class="infoSection">
    <span class="infoTitle">{{ $t('rightDetail_userGroup') }}</span>
    <div class="infoContent">
      <div class="listSection">
        <div class="listTitle">{{ $t('permission.read') }}</div>
        <div class="listContent">
          <BrowseInfoAclItem v-for="(ace, i) in ReadList" :key="i" :ace="ace" :permission="permission"
                             @handleRemove="handleRemove"></BrowseInfoAclItem>
        </div>
      </div>

      <div class="listSection">
        <div class="listTitle">{{ $t('permission.write') }}</div>
        <div class="listContent">
          <BrowseInfoAclItem v-for="(ace, i) in ReadWriteList" :key="i" :ace="ace" :permission="permission"
                             @handleRemove="handleRemove"></BrowseInfoAclItem>
        </div>
      </div>

      <!-- <div class="listSection">
        <div class="listTitle">{{ $t('permission.manage') }}</div>
        <div class="listContent">
          <BrowseInfoAclItem v-for="(ace, i) in ManageRecordList" :key="i" :ace="ace" :permission="permission"  @handleRemove="handleRemove"></BrowseInfoAclItem>
        </div>
      </div> -->

      <div class="listSection">
        <div class="listTitle">{{ $t('permission.manage') }}</div>
        <div class="listContent">
          <BrowseInfoAclItem v-for="(ace, i) in ManageRecordList" :key="i" :ace="ace" :permission="permission"
                             @handleRemove="handleRemove"></BrowseInfoAclItem>
        </div>
      </div>

<!--      <div class="listSection">-->
<!--        <div class="listTitle">{{ $t('permission.custom') }}</div>-->
<!--        <div class="listContent">-->
<!--          <BrowseInfoAclItem v-for="(ace, i) in CustomList" :key="i" :ace="ace" :permission="permission"-->
<!--                             @handleRemove="handleRemove"></BrowseInfoAclItem>-->
<!--        </div>-->
<!--      </div>-->

    </div>

  </div>
</template>


<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const props = defineProps<{ doc: any, permission: any }>()
const { doc, permission } = toRefs(props)
const { t } = useI18n()

const aces = ref([])
const userId = useUserId()
const dialogEl = ref()

async function handleDataGet() {
  const data: any = await clientApi.api.getDocpalAclResourceResourceid(props.doc.id).then(res => res.data)

  aces.value = data.filter((item: any) => item.name !== null)
}

const ReadList = computed(() => {
  return aces.value?.filter((ace: any) => ace.acl === 'r')
})
const ReadWriteList = computed(() => {
  return aces.value?.filter((ace: any) => ace.acl === 'w')
})
const ManageRecordList = computed(() => {
  return aces.value?.filter((ace: any) => ace.acl === 'm')
})
const EverythingList = computed(() => {
  return aces.value?.filter((ace: any) => ace.acl === 'e')
})

const CustomList = computed(() => {
  return aces.value?.filter((ace: any) => ace.acl === 'c')
})

// #region module: handle Edit
async function handleRemove(ace) {
  const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`, {
    confirmButtonText: `${t('dpButtom_confirm')}`,
    cancelButtonText: `${t('dpButtom_cancel')}`
  }).catch((action) => {
    return action
  })
  if (action !== 'confirm') return
  await clientApi.api.deleteNuxeoDocumentAclRemove({ idOrPath: props.doc.id, userId: ace.userId })
  handleDataGet()
}

function handleAdd(type?: string) {
  const data = {
    permission: type
  }
  dialogEl.value.handleOpen(data)
}

async function handleAddLocalAclSubmit(_data: any, cb) {
  _data.idOrPath = props.doc.id
  await clientApi.api.postNuxeoDocumentAclAdd(_data)
  handleDataGet()
  cb()
}

async function handleUpdateLocalAclSubmit(_data: any, cb) {
  _data.idOrPath = props.doc.id
  _data.aceId = _data.id
  delete _data.isPermanent
  delete _data.id
  await clientApi.api.putNuxeoDocumentAclReplace(_data)
  handleDataGet()
  cb()
}

// #endregion

watch(doc, async (val: String) => {
  if (val) {
    await handleDataGet()
  }
}, { immediate: true })


</script>


<style lang="scss" scoped>
.listTitle {
  font-size: .8rem;
  margin-block: 6px;
}

.listSection {
  width: 100%;
  margin-bottom: 6px;

  & + & {
    border-top: 1px solid var(--app-grey-100);
  }
}

.infoContent, .listContent {
  display: flex !important;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}
</style>
