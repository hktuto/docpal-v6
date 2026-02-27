<script setup lang="ts">
import { newClientApi } from 'api';
import dayjs from "dayjs";
  const {doc} = defineProps<{
    doc: any
  }>()
  
  const hocrUrl = ref();
  
  const state = reactive({
      ocrState:"PENDING",
      lastCheckTime: new dayjs(),
      loading:false,
      hocrHtml:"",
      hocrUrl:"",
  })
  
function reload() {
    getOcr();
}

  async function getOcr():Promise<void> {
    try{
        // step 1 get OCR Status,
        const ocrStatus = await newClientApi.getNuxeoDocumentDocumentidOcrState(doc.id).then(res => res.data);
        state.ocrState = ocrStatus
        if(ocrStatus === 'FINISH') {
            
          const response = await newClientApi.postNuxeoDocumentAttachmentHocrDownload({
            idOrPath: doc.id
          },{
            format: 'blob',
            timeout: 0,
          });
          let text = await response.text();
          const defaultStyle = `
                  <style id="frontendCustomStyle">
                      *{
                          font-family: 'Segoe UI', 'Roboto', Oxygen, Ubuntu, Cantarell, -apple-system,
                                      BlinkMacSystemFont, 'Open Sans', 'Helvetica Neue', sans-serif;
                          font-size: 14px;
                          line-height: 1;
                      }
                      body{
                          counter-reset: page;
                      }
                      .ocr_page{
                          padding: 10px;
                          border-radius: 12px;
                          box-shadow: 0 4px 8px rgb(0 0 0 / 10%);
                          margin-bottom: 24px;
                          counter-increment: page;
                          background-color: #fff;
                      }
                      .ocr_page::before{
                          content: counter(page);
                          display:block;
                      }
                      .ocr_line{
                          display: block;
                          margin-bottom: 6px;
                          word-break: break-all;
                      }
                      .ocrx_word.hover {
                          background-color: rgba(13,89,170,0.3);
                          border: 2px solid #007eff;
                      }
                      .ocr_line.hover {
                          background-color: rgba(13,89,170,0.1);
                      }
                  </style>
                  </body>
              `
          text = text.replace('</body>', defaultStyle).replace('<title />', '');
          const newBlob =  new Blob([text], {type: 'text/html'});
          const urlCreator = window.URL || window.webkitURL
          const url = urlCreator.createObjectURL(newBlob)
          state.hocrUrl = url
        }
    }catch(err) {
      hocrUrl.value = null;
    }
    
  }

  watch(
      () => doc,
    async (newDoc) => {
      if (newDoc.path) {
        await getOcr()
      }
    },
    {
      immediate: true,
    })
</script>

<template>
  <div class="ocrContainer">
    <div v-if="state.ocrState === 'PENDING'">
      loading...
    </div>
    <div v-else-if="state.ocrState === 'FINISH'" style="width:100%; height: 100%;">
        <iframe :src="state.hocrUrl" frameborder="0" width="100%" height="100%" ></iframe>
    </div>
      <div v-else>
         <p style="color: var(--el-color-warning); padding: var(--app-space-xs)">
             Can not success convert to OCR, if you think this is an error, please replace the file to try again.
         </p>
      </div>
  </div>
</template>

<style scoped lang="scss">
.ocrContainer{
  height: 100%;
}
</style>