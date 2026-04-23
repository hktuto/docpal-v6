export const getServiceTaskItemConfig = {
  ConditionTask: {
    relation: 'AND',
    conditions: [
      {
        relation: 'OR',
        rule: []
      }
    ]
  },
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
      templateId: '',
      variables: {}
    },
    output_mapping: {}
  },
  FilingDocuments: {
    implementation: 'filing_document',
    method: 'POST',
    url: `${getUrlOrigin()}/api/dms/facade/filing-document`,
    headers: generatorHTTPRequestTaskHeaders(),
    body: {
      folderCabinetId: '',
      folderCabinet: []
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
