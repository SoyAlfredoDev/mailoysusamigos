import { test } from "node:test";
import assert from "node:assert/strict";
import { hasSameOrigin } from "../src/lib/request-origin";
test("formularios permiten el mismo host público y rechazan otros orígenes",()=>{
  const request=(origin:string,host:string)=>new Request("http://localhost:3007/api/reservas",{headers:{origin,host}});
  assert.equal(hasSameOrigin(request("http://127.0.0.1:3007","127.0.0.1:3007")),true);
  assert.equal(hasSameOrigin(request("https://milo.example","milo.example")),true);
  assert.equal(hasSameOrigin(request("https://evil.example","milo.example")),false);
  assert.equal(hasSameOrigin(request("null","milo.example")),false);
});
