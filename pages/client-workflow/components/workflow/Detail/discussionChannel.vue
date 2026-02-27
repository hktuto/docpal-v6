<template>
  <div class="grid-layout">
    <el-button v-if="!noToggle" :class="['icon', state.expended? 'rotate': 'revert'] "
               @click="handelExpand" :icon="ArrowLeftBold" circle />
    <div :class="[{'discussionChannel--expand': !noToggle? state.expended : true }, 'discussionChannel', {noToggle}]">
      <h4 v-if="!noToggle" class="title">{{ $t('common_discussionChannel') }}</h4>
      <div class="commentViewBox">
        <CommentCard v-for="(item) in state.commentList" :key="item.id" :commentInfo="item"></CommentCard>
      </div>
      <CommentInputBox @handleAdd="handleAddComment" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import { ArrowLeftBold } from '@element-plus/icons-vue'

const props = defineProps<{
  id: string,
  noToggle: boolean,
}>()
// @ts-ignore
const userId: string = useUserId().value
const state = reactive<any>({
  expended: false,
  commentList: []
})

function handelExpand() {
  state.expended = !state.expended
}

async function handleAddComment(text: string, callback: Function) {
  const param = {
    processInstanceId: props.id,
    userId,
    text
  }
  const res = await newClientApi.postDocpalWorkflowCommentProcess(param)
  callback()
  if (!res) return
  await getCommentList()
}

async function getCommentList() {
  const res = await newClientApi.getDocpalWorkflowCommentProcess({ processInstanceId: props.id }).then(res => res.data || [])
  if (!res) return
  state.commentList = res?.map((item: any) => ({
    text: item.text,
    creationDate: item.time,
    author: item.userId
  })).reverse()
}

watch(() => props.id, (newValue) => {
  console.log(newValue)
  if (newValue) getCommentList()
}, { immediate: true })
</script>

<style lang="scss" scoped>
.grid-layout {
  display: grid;
  grid-template-columns: min-content 1fr;
}

.discussionChannel {
  width: 0;
  overflow: hidden;
  transition: all .5s;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);

  &--expand {
    width: 380px;
    transition: all .5s;

  }

  &.noToggle {
    grid-template-rows: 1fr min-content;
  }

  h4 {
    line-height: 2rem;
    margin: unset;
    padding: unset;
  }

  .commentViewBox {
    overflow: auto;
  }
}

.rotate {
  transition: all 1s;
  transform: rotate(180deg);
}

.revert {
  transition: all 1s;
}
</style>
