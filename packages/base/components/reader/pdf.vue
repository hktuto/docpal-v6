<template>
    <div class="iframeContainer" v-if="!props.loading">
        <iframe ref="iframe" :src="pdfReaderUrl" allowfullscreen />
    </div>
</template>

<script lang="ts" setup>

import { useEventListener } from '@vueuse/core'
import { newClientApi } from 'api'
type PdfJsOptions = {
    print: boolean,
    loadAnnotations: boolean,
    readOnly: boolean
}
const props = withDefaults(defineProps<{
    annotations: Map<string,any>,
    blob: Blob,
    name: String,
    options: PdfJsOptions,
    loading: Boolean
}>(),{
    options:{
        print: false,
        loadAnnotations: false,
        readOnly: true
    }
})
const display = ref(false)
const { annotations, blob, name } = toRefs(props)

const iframe = ref<HTMLIFrameElement>();
const { public:{ pdfReaderUrl } } = useRuntimeConfig();
const { locale } = useI18n()
const colorMode = useColorMode();

const emits = defineEmits(['ready'])
async function getAnnotation():Promise<Object> {
    if(!props.options.loadAnnotations) return new Map();
    const annotation = await newClientApi.getDmsDocumentAnnotations(props.doc.id);
    let annotationObj = []
    if(annotation.length > 0) {
        if(annotation[0].object.paths) {
            annotationObj = Array.isArray(JSON.parse(annotation[0].object.paths)) ? JSON.parse(annotation[0].object.paths) : []
        }
    }
    const annotationMap = new Map();
    annotationObj.forEach((item:any) => {
        annotationMap.set(item.id, item);
    });
    return annotationMap;
}
async function sendPdfAndAnnotation() {
    if(!props.blob) return;
    const blob = structuredClone(toRaw(props.blob))
    const annotations = await getAnnotation()
    const options = structuredClone(toRaw(props.options))

    sendMessageToIframe({
        blob,
        filename: props.name,
        annotations,
        locale: locale.value,
        options
    });
}
async function saveAnnotation(annotation:Map<string, object>) {
    //return if annotation is empty

    // convert Map to array of objects
    const paths:any[] = [];
    const comments = [];

    annotation.forEach((value:any, key:any) => {
        if(value.annotationType === 3){
            comments.push({text:value.value});
          }
      paths.push({id: key, ...value});
    });
    const param = {
        documentIdOrPath: props.doc.id,
        object: {
            paths: JSON.stringify(paths)
        },
        comments
    }
    await newClientApi.postDmsDocumentAnnotation([param])
    //  TODO : show notification
}

async function sendMessageToIframe(data?: any) {
  const frame = iframe.value?.contentWindow;
  if(!frame) return;
  frame.postMessage(data, '*');
}

async function search(query: string) {
  const frame = iframe.value?.contentWindow;
  if(!frame) return;
  sendMessageToIframe({ type: 'search', options: { query } });
}

function gotMessageFromIframe(message:MessageEvent) {
    const { data:{ data, type} } = message;
    if(!data && !type ) return;
    const interval = setInterval(() => {
        if(!props.loading) {
            clearInterval(interval)
            switch(type) {
              case 'ready':
                emits('ready')
                sendPdfAndAnnotation()
                break;
              case 'annotation':
                  saveAnnotation(data)
              break;
              case 'print':
                console.log('print from pdf')
                    // TODO :　 add print handler
                    break;
                default:
                    break;
            }
        }
    }, 500)

}
useEventListener(window, 'message', gotMessageFromIframe)

defineExpose({
  sendMessageToIframe,
  search
})
</script>

<style lang="scss" scoped>
.contentContainer{
    width: 100%;
    height: 100%;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
}
.iframeContainer{
    width: 100%;
    margin: 0 auto;
    height: 100%;
}
iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
</style>
