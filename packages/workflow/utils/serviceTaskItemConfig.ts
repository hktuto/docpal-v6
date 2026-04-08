export const GetServiceList = [
  { label: 'Upload File', value: 'UploadFile' },
  { label: 'Document Generation Task', value: 'DocumentGenerationTask' },
  { label: 'Message Task', value: 'MessageTask' },
  { label: 'Unique Id Generator', value: 'UniqueIdGenerator' },
  { label: 'Submit Easy Form', value: 'SubmitEasyForm' },
  { label: 'Filing Documents', value: 'FilingDocuments' }
]

export const getServiceTaskItemConfig = {
  DocumentGenerationTask: {
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
      properties: {
        title: '',
        createDate: ''
      }
    },
    input_mapping: {
      document_name: '',
      document_type: '',
      document_file_id: '',
      apply_user: '',
      apply_date: ''
    },
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
    input_mapping: {
    }
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
    'x-api-key': 'bf77bd45b0a82691b911054d2f9ca50d3b70dc964782b419456e7fdd9ddc0a5ca19b0638d42662a0e22c4734ce8d787c',
    'Content-Type': 'application/json'
  }
}
