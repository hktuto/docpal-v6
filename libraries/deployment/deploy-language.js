const fs = require('fs')
const path = require('path')
const enJson = require('./src/en-US.json')
const zhJson = require('./src/zh-CN.json')
const zhHKJson = require('./src/zh-HK.json')

function parseArgv() {
  const args = {}
  for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      let value = true
      if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
        value = process.argv[i + 1]
        i++
      }
      args[key] = value
    }
  }
  return args
}

const argv = parseArgv()

const { SUPERADMIN, PASSWORD, ADMINURL } = argv
const URL = ADMINURL.replace('/admin/api', '')

async function loginAdmin() {
  // 用户中心登录：Gateway /apis/v1/ucenter/auth/login，body 需 serviceId
  const loginUrl = `${URL}/apis/v1/ucenter/auth/login`
  console.log('try to login admin', loginUrl)
  const res = await fetch(loginUrl, {
    method: 'POST',
    body: JSON.stringify({
      username: SUPERADMIN,
      password: PASSWORD,
      serviceId: 'docpal',
      rememberMe: true
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const body = await res.json().catch(() => null)
  const token = body?.data?.access_token
  if (!token) {
    console.log('--login failed', res.status, JSON.stringify(body))
    throw new Error(body?.message || `login failed: HTTP ${res.status}`)
  }
  return token
}

async function updateLanguage(code, token) {
  let dataList
  try {
    const { data } = await fetch(`${URL}/api/dms/form-properties/language/list?locale=${code}&languageKey=client`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(async (res) => await res.json())
    if (data.length) {

      dataList = data[0]
    } else {
      dataList = {

        locale: code,
        languageKey: 'client',
        languageContent: JSON.stringify({})
      }
    }
  } catch (e) {
    console.log('--getLanguage error', e)
  }

  // const newJson = await fs.readFileSync(path.join(__dirname, `./lang/${code}.json`), {
  //     encoding: 'utf-8'
  // })
  const newJson = code === 'en-US' ? enJson : code === 'zh-CN' ? zhJson : zhHKJson
  const newData = {
    ...dataList,
    languageContent: JSON.stringify(newJson)
  }
  console.log('---newData', newData.id, newData.locale)

  try {
    const res = await fetch(`${URL}/api/dms/form-properties/language`, {
      method: 'POST',
      body: JSON.stringify(newData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(async (res) => {
      const data = await res.json()
      if (data.code !== 200) {
        throw Error(data.message)
      }
    })
  } catch (e) {
    console.log('--updateLanguage error', e)
  }

  console.log('finish update language', ADMINURL, URL, code)
}

async function deployLanguage() {
  // const { superAdmin, password, adminUrl } = argv;
  const availableLang = ['en-US', 'zh-CN', 'zh-HK']
  const token = await loginAdmin()
  console.log('----getToken', token)
  for (let i = 0; i < availableLang.length; i++) {
    await updateLanguage(availableLang[i], token)
  }
  console.log('deploy language success')
}

deployLanguage()
