<script lang="ts" setup>
/**
 * 文件夹类型：在openFileDetail的options传参 commentId
 * 文件类型：在文件路径添加 query commentId
 */
import anime from 'animejs'
import { useEventListener } from '@vueuse/core'
import { clientApi } from 'api'

const props = defineProps<{
  doc: any
  disabled: boolean
  commentId?: string
}>()
const state = reactive<any>({
  loading: false,
  commentList: [],
  commentInfo: {
    text: ''
  },
  userList: [],
  userListWithoutMe: [],
  commentScroll: false
})
const userId = useUserId()
const route = useRoute()

async function handleAddComment(text, cb) {
  const res = await clientApi.api.postDmsDocumentComments({
    text,
    documentIdOrPath: props.doc.id
  }).then((res) => res.data)
  if (!res) return
  state.commentInfo.text = ''
  await handleCommentsGet()
  cb()
}

async function handleReply(params: any, cb) {
  params.documentIdOrPath = props.doc.id
  const res = await clientApi.api.postDmsDocumentComments(params).then((res) => res.data)
  console.log(res)

  if (!res) return
  console.log('reply', params.parentId)

  const resData = await getCommentList({ documentIdOrPath: props.doc.id, parentId: params.parentId })
  console.log('??????????')

  cb(resData)
}

async function handleReplyDelete(item, parentItem) {
  const res = await clientApi.api.deleteDmsDocumentComments({ commentId: item.id }).then((res) => res.data)
  if (!res) return
  if (!parentItem) {
    // handleCommentsGet()
    const index = state.commentList.findIndex((cc) => cc.id === item.id)
    state.commentList.splice(index, 1)
  } else {
    const index = state.commentList.findIndex((cc) => cc.id === item.id)
    parentItem.children.splice(index, 1)
    // const resData = await getCommentList({ documentIdOrPath: props.doc.id, parentId: parentItem.id })
    // parentItem.children = resData
  }
}

async function handleCommentsGet() {
  try {
    state.loading = true
    if (state.userList.length == 0) await getUserList()
    const res = await getCommentList({ documentIdOrPath: props.doc.id })
    if (!res) return
    for (const item of res) {
      if (item.parentId === props.doc.id) item.parentId = ''
      item.children = []
      item.children = await getCommentList({ documentIdOrPath: props.doc.id, parentId: item.id })
      if (item.children.length > 0) item.replyListShow = true
    }
    state.commentList = res
    if (state.commentList.length > 0) handleScroll()
  } catch (error) {
    console.log('get comment', error)
  } finally {
    state.loading = false
  }
}

async function getUserList() {
  const userList = await clientApi.api.postUcenterUsers({}).then((res) => res.data)
  state.userList = userList
    .sort((a, b) => a.username.localeCompare(b.username))
    .map((item) => {
      const fullName = item.firstName || item.lastName ? item.firstName + ' ' + item.lastName : item.userName
      return {
        label: fullName,
        value: item.userId
      }
    })
  state.userListWithoutMe = state.userList.filter((item) => item.value !== userId.value)
}

function getUserName(_userId: string) {
  const regex = /(?<=@\{)[\w-]+(?=\})/g
  const matches = _userId.match(regex)
  const name = matches ? matches[0] : _userId.replace('@', '')
  const user = state.userList.find((item) => item.value === name)
  return user ? user.label : _userId
}

async function getCommentList(params) {
  const data: any = await clientApi.api.postDmsDocumentCommentsList(params).then((res) => res.data)
  const regex = /@\{([^}]+)\}/g
  try {
    data.forEach((item) => {
      item.authorFullName = getUserName(item.author)
      let matches = item.text.match(regex)
      if (matches && matches.length > 0) {
        item.text = item.text.replace(regex, (match, p1) => {
          return '<span class="commentCard_mention">@' + getUserName(match) + ' </span>'
        })
      }
    })
  } catch (error) {
    console.error(error)
  }
  return data
}

function handleScroll(commentId?: string) {
  nextTick(() => {
    try {
      let scrollHeight = 100
      if (!commentId) commentId = props.commentId
      if (!state.commentScroll && commentId) {
        const commentBox = document.getElementById(`comment_${commentId}`)
        scrollHeight = commentBox.offsetTop - 80

        commentBox.classList.add('highlight-comments')
        commentBox.addEventListener('click', () => commentBox.classList.remove('highlight-comments'))
        setTimeout(() => (state.commentScroll = true))
      } else {
        const viewBox = document.getElementsByClassName('commentViewBox')[0]
        scrollHeight = viewBox.scrollHeight
      }

      anime({
        targets: '.commentViewBox',
        duration: 200,
        scrollTop: scrollHeight,
        easing: 'easeInSine'
      })
    } catch (error) {
      console.log(error)
    }
  })
}

useEventListener(document, 'refreshComment', handleCommentsGet)
watch(
  () => props.doc,
  (val) => {
    if (val) handleCommentsGet()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.commentId,
  (newVal, oldVal) => {
    // if(!oldVal || !newVal.commentId) return
    if (newVal) {
      state.commentScroll = false
      handleScroll(newVal)
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="comments" v-loading="state.loading">
    <!-- <span class="title">{{ $t('rightDetail_comments') }}</span> -->
    <CommentViewBox
      :commentList="state.commentList"
      :disabled="disabled"
      :mentionData="state.userListWithoutMe"
      @handleReply="handleReply"
      @handleReplyDelete="handleReplyDelete"
    />
    <CommentInputBox
      id="commentRootInput"
      v-if="!disabled"
      :mentionData="state.userListWithoutMe"
      v-model="state.commentInfo.text"
      @handleAdd="handleAddComment"
    />
  </div>
</template>

<style lang="scss" scoped>
.comments {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-xs);
}

.highlight-comments {
  background: var(--color-primary);
}
</style>
