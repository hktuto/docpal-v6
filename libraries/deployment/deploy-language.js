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
  const data = await fetch(`${URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      username: SUPERADMIN,
      password: PASSWORD
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (res) => await res.json())
    .catch(error => {
      console.log('--login error', error)
    })
  return data.access_token
}

async function updateLanguage(code, token) {
  const { data } = await fetch(`${URL}/api/dms/form-properties/language/list?locale=${code}&languageKey=client`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then(async (res) => await res.json())
    .catch(error => {
      console.log('--getLanguage error', error)
    })
  // const newJson = await fs.readFileSync(path.join(__dirname, `./lang/${code}.json`), {
  //     encoding: 'utf-8'
  // })
  const newJson = code === 'en-US' ? enJson : code === 'zh-CN' ? zhJson : zhHKJson
  const newData = {
    ...data[0],
    languageContent: JSON.stringify(newJson)
  }
  console.log('---JSON String',JSON.stringify(newData))

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
      throw new Error(data.message)
    }
  }).catch(error => {
    console.log('--updateLanguage error', error)
  })
  console.log('finish update language', ADMINURL, URL, code)
}

async function deployLanguage() {
  // const { superAdmin, password, adminUrl } = argv;
  const availableLang = ['en-US', 'zh-CN', 'zh-HK']
  const token = await loginAdmin()
  console.log('----getToken',token)
  for (let i = 0; i < availableLang.length; i++) {
    await updateLanguage(availableLang[i], token)
  }
  console.log('deploy language success')
}

deployLanguage()
