import {readFile} from 'node:fs/promises'
import {validateCatalog,checkItem} from './content-core.mjs'
const c=validateCatalog(JSON.parse(await readFile('public/content/catalog.json','utf8')))
const q=JSON.parse(await readFile('content/approved.json','utf8'))
if(q.schema!==1||!Array.isArray(q.items))throw Error('invalid approval queue')
for(const i of q.items)checkItem(i,true)
console.log('Catalog v'+c.version+': '+c.items.length+' unique references; '+q.items.length+' reviewed queue entries')
