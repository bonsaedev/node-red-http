<script setup lang="ts">
import { useFormNode } from "@bonsae/nrg/client";
import type {
  ConfigsSchema,
  CredentialsSchema,
} from "../../shared/schemas/http-request";

const { node } = useFormNode<typeof ConfigsSchema, typeof CredentialsSchema>();

const methods = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" },
  { value: "PATCH", label: "PATCH" },
  { value: "use", label: "- use msg.method -" },
];

const returns = [
  { value: "txt", label: "a UTF-8 string" },
  { value: "bin", label: "a binary buffer" },
  { value: "obj", label: "a parsed JSON object" },
];

const payloadModes = [
  { value: "ignore", label: "ignore" },
  { value: "query", label: "append to query string" },
  { value: "body", label: "send as request body" },
];

const authTypes = [
  { value: "", label: "no authentication" },
  { value: "basic", label: "basic authentication" },
  { value: "digest", label: "digest authentication" },
  { value: "bearer", label: "bearer token" },
];
</script>

<template>
  <div class="form-row">
    <NodeRedInput v-model:value="node.name" label="Name" icon="tag" />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.method"
      label="Method"
      icon="exchange"
      :options="methods"
    />
  </div>

  <div class="form-row">
    <NodeRedTypedInput
      v-model:value="node.url"
      label="URL"
      icon="globe"
      :types="['str', 'msg']"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.paytoqs"
      label="Payload"
      icon="arrows-h"
      :options="payloadModes"
    />
  </div>

  <div class="form-row">
    <NodeRedTypedInput
      v-model:value="node.headers"
      label="Headers"
      icon="list"
      :types="['json', 'msg']"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.ret"
      label="Return"
      icon="sign-out"
      :options="returns"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.authType"
      label="Authentication"
      icon="lock"
      :options="authTypes"
    />
  </div>

  <template v-if="node.authType === 'basic' || node.authType === 'digest'">
    <div class="form-row">
      <NodeRedInput
        v-model:value="node.credentials.user"
        label="Username"
        icon="user"
      />
    </div>
    <div class="form-row">
      <NodeRedInput
        v-model:value="node.credentials.password"
        label="Password"
        icon="lock"
        type="password"
      />
    </div>
  </template>

  <div v-if="node.authType === 'bearer'" class="form-row">
    <NodeRedInput
      v-model:value="node.credentials.bearerToken"
      label="Token"
      icon="lock"
      type="password"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.persist"
      label="Keep the connection alive"
      icon="plug"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.senderr"
      label="Send request errors to the output"
      icon="warning"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.insecureHTTPParser"
      label="Enable insecure HTTP parser"
      icon="unlock"
    />
  </div>
</template>
