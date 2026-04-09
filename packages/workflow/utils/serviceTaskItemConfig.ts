export const getServiceTaskItemConfig = {
  SubProcess: {
    processDefinitionId: ''
  },
  ValidateTask: {
    rules: [],
    output_mapping: {}
  },
  MessageTask: {
    implementation: 'email',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/email/send`,
    headers: generatorHTTPRequestTaskHeaders(),
    to: [],
    cc: [],
    subject: '',
    body: '',
    input_mapping: {}
  },
  UploadFile: {
    implementation: 'upload_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/document/creation`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      parentPath: '',
      name: '',
      type: '',
      fileContentId: '',
      creator: '',
      properties: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  DocumentGenerationTask: {
    implementation: 'upload_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/document/template/generate`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      templateId: '',
      parentPath: '',
      name: '',
      type: 'File',
      creator: '',
      variables: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  UniqueIdGenerator: {
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/id-template/generate`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      templateId: '01KG66ARVKJGEFS4FVDV4QFT1Y',
      variables: {
        name: '${username}'
      }
    },
    output_mapping: {
      create_status: 'success',
      document_number: '${data}'
    }
  },
  FilingDocuments: {
    implementation: 'document_generation',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/generate/folder-cabinet/documents`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      documentId: '${rootDocumentId}',
      folderCabinetId: '01KKTSAVMF81P85GSAJEPK0VD4',
      documentFileId: '',
      name: 'Personal File',
      mapping: {},
      children: [
        {
          folderCabinetId: '177cfa96-37ca-40bd-ab3c-2221c5c7c979',
          documentFileId: '',
          name: '${onces_name}',
          mapping: {
            'fc:docTitle': '${onces_name}'
          },
          children: [
            {
              folderCabinetId: 'f2f04c71-ef4f-43aa-86a8-496d892f971f',
              documentFileId: '${file1}',
              name: '${once_files_name}',
              mapping: {
                'fc:docTitle': '${once_files_name}',
                'fc.createDate': '${apply_date}'
              }
            }
          ]
        }
      ],
      variables: {}
    },
    input_mapping: {},
    output_mapping: {}
  }
}

export function getUrlOrigin() {
  return 'https://sit-v3.wclsolution.com'
  // return window?.location?.origin || ''
}

// TODO get config setting
function generatorHTTPRequestTaskHeaders() {
  return {
    ServerName: 'docpal-api',
    ServerKey: '14ecdf56081AGSDghw',
    'Content-Type': 'application/json'
  }
}
