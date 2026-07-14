<script setup lang="ts">
import { useFormNode } from "@bonsae/nrg/client";
import type { ConfigsSchema } from "../../shared/schemas/http-out";

const { node } = useFormNode<typeof ConfigsSchema>();
</script>

<template>
  <div class="form-row">
    <NodeRedInput v-model:value="node.name" label="Name" icon="tag" />
  </div>

  <div class="form-row">
    <NodeRedInput
      v-model:value="node.statusCode"
      label="Status Code"
      icon="sign-out"
      placeholder="200"
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
</template>
