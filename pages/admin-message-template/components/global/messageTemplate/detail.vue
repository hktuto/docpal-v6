<script setup lang="ts">
import { newAdminApi } from 'api'
import { newMessageTemplateTemplatePageRoute } from '~/utils/messageTemplateHelper'

const routerProvider = inject(MenuRouterKey)
const { id } = defineProps<{
  id: number
}>()
const loading = ref(false)
const detailData = ref()

async function getData() {
  loading.value = true
  detailData.value = await newAdminApi.getDocpalMessageTemplateDetailsId(id).then(r => r.data)
  loading.value = false
}

function handleEditTemplate() {
  const tabItem = newMessageTemplateTemplatePageRoute({ id, ...detailData.value.template })
  routerProvider?.navigateTo(tabItem)
}

const deleteDialogRef = ref()

function handleDeleteTemplate() {
  deleteDialogRef?.value?.open({ id, ...detailData.value.template })
}

const duplicateDialogRef = ref()

function handleDuplicateTemplate() {
  duplicateDialogRef?.value?.open({ id, ...detailData.value.template })
}

function goBack() {
  const tabItem = newMessageTemplateList()
  routerProvider?.navigateTo(tabItem)
}

onMounted(() => {
  getData()
})
</script>

<template>
  <div class="pageContainer">
    <div v-if="detailData" class="infoContainer section">
      <div class="label">
        {{ detailData.template.name }}
      </div>
      <div class="actions">
        <ElButton id="MessageTemplate__Detail__EditTemplate" type="link" @click="handleEditTemplate">
          {{ $t('messageTemplate_edit') }}
        </ElButton>
        <ElDropdown>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem @click="goBack">Back</ElDropdownItem>
              <ElDropdownItem @click="handleDuplicateTemplate">Duplicate</ElDropdownItem>
              <ElDropdownItem @click="handleDeleteTemplate">Delete</ElDropdownItem>
            </ElDropdownMenu>
          </template>
          <ElButton type="link">
            <ElIcon>
              <SvgIcon class="dropdownIcon" src="/icons/dots.svg" />
            </ElIcon>
          </ElButton>
        </ElDropdown>
      </div>
      <ElDivider />
      <div class="subSection">
        <div class="label">Stat</div>
        <div class="desc">Message Open/Sent</div>
        <div class="statCountContainer">
          <div v-for="stat in detailData.messageCounts" :key="stat.name" class="stat">
            <div class="type">{{ stat.name }}</div>
            <div class="count">{{ stat.readCount }}/{{ stat.sendCount }}</div>
          </div>
        </div>
      </div>
      <ElDivider />
      <div class="subSection">
        <div class="label">Publish Status</div>
        <div class="statCountContainer">
          <div v-for="stat in detailData.templateStatuses" :key="stat.name" class="stat">
            <div class="type">{{ stat.name }}</div>
            <div class="count">{{ stat.status }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="detailData" class="preview section">
      <MessageTemplatePreviewText :template="detailData.template" title="Whatsapp" :showConfirm="true"
                                  bgColor="#F6EBCF" />
      <MessageTemplatePreviewText :template="detailData.template" title="Wechat" bgColor="#E2F6CF" />
    </div>
    <MessageTemplateDeleteDialog ref="deleteDialogRef" @success="goBack" />
    <MessageTemplateDuplicateDialog ref="duplicateDialogRef" />
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-xs);
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: var(--app-space-s);
  background: var(--app-grey-950);
}

.infoContainer {
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-s);
  align-items: flex-start;
  justify-content: flex-start;
}

.section {
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  background: var(--app-grey-950);
}

.label {
  font-size: var(--app-font-size-l);
}

.actions {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;
  --icon-size: var(--app-font-size-m);
}

.statCountContainer {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  align-items: center;
  justify-content: flex-start;

  .stat {
    padding-block: var(--app-space-s);
    display: flex;
    flex-flow: column nowrap;
    gap: var(--app-space-xs);
    align-items: flex-start;
    justify-content: flex-start;
  }

  .type {
    font-size: var(--app-font-size-m);
    color: var(--app-grey-300);
  }

  .count {
    font-size: var(--app-font-size-xl);
    color: var(--app-grey-000);
    font-weight: bold;
  }
}

.preview {
  display: flex;
  flex-flow: row wrap;
  gap: var(--app-space-s);
  background: var(--app-grey-900) !important;
}
</style>
