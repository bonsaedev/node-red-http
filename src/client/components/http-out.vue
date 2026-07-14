<script setup lang="ts">
import { useFormNode } from "@bonsae/nrg/client";
import type { ConfigsSchema } from "../../shared/schemas/http-out";

const { node } = useFormNode<typeof ConfigsSchema>();

// Labels from src/resources/locales/labels/http-out/<locale>.json.
const t = (k: string): string => node._(`http-out.${k}`);
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
    <NodeRedInput
      v-model:value="node.statusCode"
      :label="t('configs.statusCode')"
      icon="sign-out"
      placeholder="200"
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
</template>
