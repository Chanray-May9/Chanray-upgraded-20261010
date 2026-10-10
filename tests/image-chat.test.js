import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as chat } from '../functions/api/chat.js';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=';
const content=url=>[{type:'text',text:'看看图片'},{type:'image_url',image_url:{url}}];
const req=messages=>new Request('https://site.test/api/chat',{method:'POST',body:JSON.stringify({mode:'flirt',messages})});
test('image chat forwards inline raster input unchanged and keeps server credentials out of response',async()=>{
 const before=globalThis.fetch;
 try{
 let forwarded;
 globalThis.fetch=async(url,init)=>{forwarded=JSON.parse(init.body);assert.equal(init.redirect,'manual');return Response.json({choices:[{message:{content:'mock picture reply'}}]});};
 const response=await chat({request:req([{role:'user',content:content(png)}]),env:{AI_API_KEY:'test-only',AI_MODEL:'vision-test',BOARD:{get:async()=>null}}});
 assert.equal(response.status,200);assert.deepEqual(forwarded.messages.at(-1).content,content(png));assert.deepEqual(await response.json(),{reply:'mock picture reply'});
 }finally{globalThis.fetch=before;}
});
test('image chat rejects remote URLs, SVG, invalid signature, assistant images and oversized bodies',async()=>{
 for(const url of ['https://internal.example/image.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,SGVsbG8=']) assert.equal((await chat({request:req([{role:'user',content:content(url)}]),env:{}})).status,400);
 assert.equal((await chat({request:req([{role:'assistant',content:content(png)}]),env:{}})).status,400);
 assert.equal((await chat({request:req([{role:'user',content:'x'.repeat(2_000_000)}]),env:{}})).status,400);
});
test('AI does not follow upstream redirects with an authorization header',async()=>{
 const before=globalThis.fetch;let calls=0;
 try{globalThis.fetch=async(url,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://other.test'}});};const response=await chat({request:req([{role:'user',content:'hello'}]),env:{AI_API_KEY:'test-only',BOARD:{get:async()=>null}}});assert.equal(response.status,502);assert.equal(calls,1);}finally{globalThis.fetch=before;}
});
