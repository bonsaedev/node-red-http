<script setup lang="ts">
import { useFormNode } from "@bonsae/nrg/client";
import type { ConfigsSchema } from "../../shared/schemas/http-in";

const { node } = useFormNode<typeof ConfigsSchema>();

// Labels from src/resources/locales/labels/http-in/<locale>.json.
const t = (k: string): string => node._(`http-in.${k}`);

const methods = [
  { value: "get", label: "GET" },
  { value: "post", label: "POST" },
  { value: "put", label: "PUT" },
  { value: "delete", label: "DELETE" },
  { value: "patch", label: "PATCH" },
];
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
    <NodeRedInput
      v-model:value="node.url"
      :label="t('configs.url')"
      icon="globe"
      placeholder="/hello or /user/:id"
    />
  </div>
</template>
