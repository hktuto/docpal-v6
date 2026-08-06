import path from "node:path";
import fs from 'node:fs';
import { generateApi } from "swagger-typescript-api";
import dotenv from 'dotenv'
//@ts-ignore
import setting from './setting.json'

dotenv.config()

const clientUrl = process.env.CLIENTURL || setting.CLIENT_URL
const publicUrl = process.env.PUBLIC_URL || setting.PUBLIC_URL
const templateUrl = process.env.OPEN_PROXY || setting.TEMPLATE_URL
const gatewayUrl = process.env.DOCPAL_GATEWAY_PROXY || setting.DOCPAL_GATEWAY_PROXY
const endpoint = [
    {name: 'newClient', url:`${clientUrl}/v3/api-docs`, className:"Standard"},
    {name: 'template', url:`${templateUrl}/docs/swagger.json`, className:"Template"},
    {name: 'gateway', url:`${gatewayUrl}/v1/ucenter/swagger/doc.json`, className:"Gateway"},
]

async function generate(){
    try{
        // remove all old file base on endpoint
        for(let i = 0; i < endpoint.length; i++) {
            const filePath = path.resolve(process.cwd(), "./src/generate", endpoint[i].name + ".ts")
            if(fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
            const filePathJson = path.resolve(process.cwd(), "./src/generate", endpoint[i].name + ".json")
            if(fs.existsSync(filePathJson)) {
                fs.unlinkSync(filePathJson)
            }
        }

        await Promise.all(
            endpoint.map(
                point => {
                    let finalRoute:Record<string, any> = {}

                    generateApi({
                        name: point.name + '.ts',
                        output: path.resolve(process.cwd(), "./src/generate"),
                        url: point.url,
                        httpClientType: "axios",
                        generateClient:true,
                        unwrapResponseData:true,
                        apiClassName: point.className,
                        singleHttpClient:false,
                        modular:false,
                        moduleNameIndex: 0,
                        moduleNameFirstTag:false,
                        prettier: {
                            // By default prettier config is load from your project
                            printWidth: 120,
                            tabWidth: 4,
                            trailingComma: "all",
                            parser: "typescript",
                        },
                        hooks:{
                            onCreateRoute:(routeData) => {
                              // if routeData.route start with /api, remove it
                              // console.log("onCreateRoute", routeData.request.path)
                              return routeData
                            },
                            onCreateRouteName:(routeNameInfo, rawRouteInfo) => {
                                return routeNameInfo
                            },
                            onFormatRouteName: (routeInfo, templateRouteName) => {
                                // console.log("routeInfo: ",routeInfo);
                                const paths = routeInfo.route
                                  .replace('/admin/','/')
                                  .replace('/api/','')
                                  .split('/');
                                if(paths[paths.length -1] === '') {
                                    paths[paths.length -1] = 'deprecate'
                                }

                                const ignoreList = ['api','admin'];
                                const allPath = paths.reduce((all, curr, index) => {
                                  if(ignoreList.includes(curr)) return all
                                    // if curr contain "${}", replace it
                                    if(curr.includes('${')) {
                                        const newPath = curr.replace('${', '').replace('}', '')
                                    }
                                    all.push(curr)
                                    return all
                                },[])

                                let newName = routeInfo.method + toPascalCase(allPath.join('-'))
                                if(finalRoute[newName]) {
                                    newName += finalRoute[newName].length
                                }
                                finalRoute[`${routeInfo.method}_${newName}`] = {
                                    name: newName,
                                    method: routeInfo.method,
                                    route: routeInfo.route,
                                    moduleName: routeInfo.moduleName,
                                }
                                // if(!finalRoute[routeInfo.moduleName]){
                                //     finalRoute[routeInfo.moduleName]= {}
                                // }
                                // if(!finalRoute[routeInfo.moduleName][oldName]) {
                                //     finalRoute[routeInfo.moduleName][oldName] = []
                                // }
                                // if(finalRoute[routeInfo.moduleName][oldName].length > 0){
                                //     newName += finalRoute[routeInfo.moduleName][oldName].length
                                // }
                                // finalRoute[routeInfo.moduleName][oldName].push(routeInfo.method +" : " + newName + " : " + routeInfo.route)
                                return newName
                            }
                        }
                    }
                    ).then(() => {
                        // fs.writeFile( path.join(__dirname,`/generate/${point.name}.json`), JSON.stringify(finalRoute),{}, () => {
                        //     // console.log('complete')
                        // })
                    })
                }
            )
        )
    }catch(error) {
        console.log(error)
    }
}

function toPascalCase(string) {
    return `${string}`
      .toLowerCase()
      .replace(new RegExp(/[-_]+/, 'g'), ' ')
      .replace(new RegExp(/[^\w\s]/, 'g'), '')
      .replace(
        new RegExp(/\s+(.)(\w*)/, 'g'),
        ($1, $2, $3) => `${$2.toUpperCase() + $3}`
      )
      .replace(new RegExp(/\w/), s => s.toUpperCase());
  }

generate()
