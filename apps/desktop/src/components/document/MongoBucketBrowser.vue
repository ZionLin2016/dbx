<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Download, RefreshCcw } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { useToast } from "@/composables/useToast";
import { downloadBinaryCellPayload, type BinaryCellDownloadPayload } from "@/lib/binaryCellDownload";
import * as api from "@/lib/api";

const props = defineProps<{
  connectionId: string;
  database: string;
  bucket: string;
}>();

const { t } = useI18n();
const { toast } = useToast();
const loading = ref(false);
const error = ref("");
const files = ref<Awaited<ReturnType<typeof api.documentListGridFsFiles>>>([]);

const totalBytes = computed(() => files.value.reduce((sum, file) => sum + (file.length || 0), 0));

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function displayName(file: (typeof files.value)[number]): string {
  return file.filename || file.id;
}

async function loadFiles() {
  loading.value = true;
  error.value = "";
  try {
    files.value = await api.documentListGridFsFiles(props.connectionId, props.database, props.bucket);
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

async function downloadFile(file: (typeof files.value)[number]) {
  try {
    const bytes = await api.documentDownloadGridFsFile(props.connectionId, props.database, props.bucket, file.id);
    const payload: BinaryCellDownloadPayload = {
      data: bytes,
      mimeType: "application/octet-stream",
      extension: file.filename?.includes(".") ? file.filename.split(".").pop() || "bin" : "bin",
    };
    const result = await downloadBinaryCellPayload(payload, displayName(file));
    if (result.kind === "saved") {
      toast(t("grid.exported"), 2500);
    }
  } catch (e: any) {
    toast(e?.message || String(e), 5000);
  }
}

onMounted(() => {
  void loadFiles();
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="border-b border-border px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">{{ database }}.{{ bucket }}</div>
          <div class="text-xs text-muted-foreground">{{ files.length }} files / {{ formatBytes(totalBytes) }}</div>
        </div>
        <Button variant="outline" size="sm" class="h-8 gap-1.5" :disabled="loading" @click="loadFiles">
          <RefreshCcw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
          {{ t("grid.refresh") }}
        </Button>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-sm text-destructive">
      {{ error }}
    </div>

    <div v-else-if="loading && files.length === 0" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {{ t("executionSummary.executing") }}
    </div>

    <div v-else-if="files.length === 0" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {{ t("dataGrid.noRows") }}
    </div>

    <div v-else class="min-h-0 flex-1 overflow-auto">
      <table class="min-w-full border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-background">
          <tr class="border-b border-border text-left text-xs text-muted-foreground">
            <th class="px-4 py-2 font-medium">Filename</th>
            <th class="px-4 py-2 font-medium">Size</th>
            <th class="px-4 py-2 font-medium">Upload Date</th>
            <th class="px-4 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.id" class="border-b border-border/60">
            <td class="px-4 py-2 align-top">
              <div class="font-medium">{{ displayName(file) }}</div>
              <div class="mt-1 break-all text-xs text-muted-foreground">{{ file.id }}</div>
            </td>
            <td class="px-4 py-2 align-top text-muted-foreground">{{ formatBytes(file.length) }}</td>
            <td class="px-4 py-2 align-top text-muted-foreground">{{ file.uploadDate || "-" }}</td>
            <td class="px-4 py-2 align-top">
              <Button variant="ghost" size="sm" class="h-8 gap-1.5" @click="downloadFile(file)">
                <Download class="h-3.5 w-3.5" />
                Download
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
