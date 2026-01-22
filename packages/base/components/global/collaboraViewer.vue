<script lang="ts" setup>
import {useEventListener} from '@vueuse/core';

import {clientApi} from 'api'
import {nextTick, ref, toRefs} from 'vue';

const userPreference = useUserPreference()
const props = defineProps<{
  docId?: string,
  doc?: any,
  readonly: boolean
  editable: boolean
  fileType: string,
  editMode: boolean
}>()
const isEditable = computed(() => {
  if(!props.editable) return false
  if(props.doc){
    const mineType = getMimeTypeFromDocument(props.doc)
    const blockList = [ 'text/plain','text/csv']
    if(!mineType ||blockList.includes(mineType)){
      return false
    }
  }
  return true
})
const timestamp = ref(Date.now())
const {docId} = toRefs(props)
const iframeReady = ref(false)
const editing = ref(props.readonly);
const mode = ref<'view' | 'edit'>('view');
const isModified = ref(false);
const formEl = ref();
const collaboraUrl = ref('');
const css = ref('');
const ui = ref(`UITheme=${userPreference.value.color};UIMode=notebookbar;TextRuler=false;PresentationStatusbar=false;SpreadsheetSidebar=false;SavedUIState=false;TextSidebar=false;TextToolbar=false`)
const token = ref('')
const xlsxIframe = ref()
const emit = defineEmits(['saved'])

async function displayIframe() {
  iframeReady.value = false;
  const {data} = await clientApi.api.getNuxeoGetofficetokenId(props.docId, {
    fileType: props.fileType
  })
  token.value = data
  collaboraUrl.value = officeUrl(props.docId)

  nextTick(() => {
    formEl.value.submit()
  });
}

function refresh() {
  displayIframe()
}


function toggleMode() {
  if (!props.editable) return
  if (mode.value === 'view') {
    mode.value = 'edit';
  } else {
    // check 
    console.log("Doc_ModifiedStatus", isModified.value)
    if (isModified.value) {
      const confirmSave = confirm("Data will auto save when you close, are you sure?");
      if (!confirmSave) return
      // save 
      xlsxIframe.value.contentWindow.postMessage(JSON.stringify({
        MessageId: "Action_Save",
        Values: {
          DontTerminateEdit: false,
          DontSaveIfUnmodified: true,
          Notify: true
        }
      }), '*');
      window.location.reload();
    } else {
      mode.value = 'view';
    }

  }
}

const officeUrl = (docId: string) => {
  const officeURL =  'https://office.' + (location.host.includes('localhost') ? "sit-v3.wclsolution.com" : location.host)
  const WOPISrc = `${officeURL}/wopi/files/${docId}${mode.value === 'view' ? "_read_only" : ""}?fileType=${props.fileType.toUpperCase()}&readonly=${mode.value === 'view'}&access_token=${token.value}`
  return `${officeURL}/browser/85ac843/cool.html?lang=${userPreference.value.language.replaceAll('HK', "TW")}&WOPISrc=${encodeURIComponent(WOPISrc)}`;
}

function gotMessageFromIframe(e: MessageEvent) {
  let data = undefined;
  try {
    data = e.data !== 'unchanged' ? JSON.parse(e.data) ? JSON.parse(e.data) : undefined : undefined;
  } catch (error) {
    // not a valid json, ignore it
    console.error(error)
    return;
  }
  if (!data) return
  if (data.MessageId === "App_LoadingStatus") {
    iframeReady.value = true
    return
  }
  if (data.MessageId === "App_LoadingStatus") {
    // Values.success = load success or not
  }
  if (data.MessageId === "Doc_ModifiedStatus") {
    isModified.value = data.Values.Modified || false
    return
  }

  isModified.value = false;
  if (data.MessageId === "UI_Save") {
    emit('saved')
    return
  }

}


useEventListener(window, 'message', gotMessageFromIframe)

watch(mode, () => {
  displayIframe()
})
watch(docId, () => {
  if (props.editMode) toggleMode()
  else displayIframe()
}, {
  immediate: true
})

defineExpose({
  refresh, toggleMode
})

</script>

<template>
  <el-button :type="mode === 'view' ? 'info' : 'primary'" :class="{editToggleButton:true, iframeReady}"
             :disabled="!iframeReady" @click="toggleMode">
    {{ $t('collabora.' + mode) }}
    <SvgIcon v-if="isEditable" class="el-icon--right"
             :src="mode === 'view' ? '/icons/file/edit.svg' : '/icons/close.svg'"></SvgIcon>
  </el-button>
  <div class="xlsContainer">
    <form ref="formEl" :action="collaboraUrl" enctype="multipart/form-data" method="post"
          :target="'collabora-online-viewer'+ timestamp" id="collabora-submit-form">
      <input name="css_variables" :value="css" type="hidden" id="css-variables"/>
      <input name="ui_defaults" :value="ui" type="hidden" id="ui-defaults"/>
      <input name="access_token" :value="token" type="hidden" id="access-token"/>
    </form>
    <iframe ref="xlsxIframe" :id="'xlsxIframe' + docId" class="xlsxIframe" frameborder="0"
            :name="'collabora-online-viewer'+ timestamp" allowfullscreen></iframe>
  </div>
</template>

<style lang="scss" scoped>
.xlsContainer {
  width: 100%;
  height: 100%;
  position: relative;
}

.xlsxIframe {
  width: 100%;
  height: 100%;
  border-radius: var(--app-space-s);
}

.editToggleButton {
  --icon-color: var(--app-grey-000);
  --icon-size: .8rem;
  position: absolute;
  left: calc(50% - 60px);
  top: -18px;
  z-index: 2;
  opacity: 0;

  &.iframeReady {
    opacity: 1;
  }
}
</style>
