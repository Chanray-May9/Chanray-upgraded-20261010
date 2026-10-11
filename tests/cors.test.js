import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/_middleware.js";
const origin="https://chanray-may9.github.io";
test("public APIs allow Pages preflight and preserve backend errors",async()=>{
 const request=new Request("https://backend.pages.dev/api/comments",{method:"OPTIONS",headers:{Origin:origin}});
 const response=await onRequest({request,next:()=>{throw Error("preflight should not dispatch");}});
 assert.equal(response.status,204);assert.equal(response.headers.get("Access-Control-Allow-Origin"),origin);
 const error=await onRequest({request:new Request("https://backend.pages.dev/api/chat",{method:"POST",headers:{Origin:origin}}),next:()=>new Response("unavailable",{status:503})});
 assert.equal(error.status,503);assert.equal(error.headers.get("Access-Control-Allow-Origin"),origin);
});
test("admin APIs and unrelated origins never receive cross-origin access",async()=>{
 for(const [endpoint,source] of [["admin",origin],["admin-session",origin],["chat","https://other.example"]]){
  const response=await onRequest({request:new Request("https://backend.pages.dev/api/"+endpoint,{method:"OPTIONS",headers:{Origin:source}})});
  assert.equal(response.status,403);assert.equal(response.headers.get("Access-Control-Allow-Origin"),null);
 }
});
