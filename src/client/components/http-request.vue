<script setup lang="ts">
import { computed } from "vue";
import { useFormNode } from "@bonsae/nrg/client";
import type {
  ConfigsSchema,
  CredentialsSchema,
} from "../../shared/schemas/http-request";

const { node } = useFormNode<typeof ConfigsSchema, typeof CredentialsSchema>();

// Labels come from this node's locale catalog
// (src/resources/locales/labels/http-request/<locale>.json). HTTP method tokens
// (GET/POST/…) are protocol keywords and stay untranslated.
const t = (k: string): string => node._(`http-request.${k}`);

const methods = computed(() => [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" },
  { value: "PATCH", label: "PATCH" },
  { value: "use", label: t("options.method.use") },
]);

const returns = computed(() => [
  { value: "txt", label: t("options.ret.txt") },
  { value: "bin", label: t("options.ret.bin") },
  { value: "obj", label: t("options.ret.obj") },
]);

const payloadModes = computed(() => [
  { value: "ignore", label: t("options.paytoqs.ignore") },
  { value: "query", label: t("options.paytoqs.query") },
  { value: "body", label: t("options.paytoqs.body") },
]);

const authTypes = computed(() => [
  { value: "", label: t("options.authType.none") },
  { value: "basic", label: t("options.authType.basic") },
  { value: "bearer", label: t("options.authType.bearer") },
]);
</script>

<template>
  <div class="form-row">
    <NodeRedInput
      v-model:value="node.name"
      :label="t('configs.name')"
      icon="tag"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.method"
      :label="t('configs.method')"
      icon="exchange"
      :options="methods"
    />
  </div>

  <div class="form-row">
    <NodeRedTypedInput
      v-model:value="node.url"
      :label="t('configs.url')"
      icon="globe"
      :types="['str', 'msg']"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.paytoqs"
      :label="t('configs.paytoqs')"
      icon="arrows-h"
      :options="payloadModes"
    />
  </div>

  <div class="form-row">
    <NodeRedTypedInput
      v-model:value="node.headers"
      :label="t('configs.headers')"
      icon="list"
      :types="['json', 'msg']"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.ret"
      :label="t('configs.ret')"
      icon="sign-out"
      :options="returns"
    />
  </div>

  <div class="form-row">
    <NodeRedSelectInput
      v-model:value="node.authType"
      :label="t('configs.authType')"
      icon="lock"
      :options="authTypes"
    />
  </div>

  <template v-if="node.authType === 'basic'">
    <div class="form-row">
      <NodeRedInput
        v-model:value="node.credentials.user"
        :label="t('credentials.user')"
        icon="user"
      />
    </div>
    <div class="form-row">
      <NodeRedInput
        v-model:value="node.credentials.password"
        :label="t('credentials.password')"
        icon="lock"
        type="password"
      />
    </div>
  </template>

  <div v-if="node.authType === 'bearer'" class="form-row">
    <NodeRedInput
      v-model:value="node.credentials.bearerToken"
      :label="t('credentials.bearerToken')"
      icon="lock"
      type="password"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.persist"
      :label="t('configs.persist')"
      icon="plug"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.senderr"
      :label="t('configs.senderr')"
      icon="warning"
    />
  </div>

  <div class="form-row">
    <NodeRedToggle
      v-model="node.insecureHTTPParser"
      :label="t('configs.insecureHTTPParser')"
      icon="unlock"
    />
  </div>
</template>
