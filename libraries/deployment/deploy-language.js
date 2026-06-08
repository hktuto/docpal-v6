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
  try {
    const path = `${URL}/api/auth/login`
    console.log("try to login admin", path)
    const { data } = await fetch(path, {
      method: 'POST',
      body: JSON.stringify({
        username: SUPERADMIN,
        password: PASSWORD
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async (res) => await res.json())
    return data.access_token
  } catch (e) {
    console.log('--login error', e)
    throw e
  }
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
