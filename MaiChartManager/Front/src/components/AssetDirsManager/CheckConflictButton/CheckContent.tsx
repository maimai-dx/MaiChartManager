import { defineComponent, onMounted, ref } from "vue";
import { CheckConflictEntry } from "@/client/apiGen";
import api from "@/client/api";
import { DataTableColumns, NButton, NDataTable, NFlex } from "naive-ui";
import { globalCapture } from "@/store/refs";

const columns: DataTableColumns<CheckConflictEntry> = [
  {type: 'selection'},
  {title: 'Song ID', key: 'musicId'},
  {title: 'Song Name', key: 'musicName'},
  {title: 'Overwritten Resource', key: 'lowerDir'},
  {title: 'Overwriting Resource', key: 'upperDir'},
  {title: 'File Name', key: 'fileName'},
]

export default defineComponent({
  props: {
    dir: {type: String, required: true}
  },
  setup(props) {
    const data = ref<(CheckConflictEntry & { key: number })[]>([]);
    const selectedIds = ref<number[]>([]);
    const load = ref(true);

    const update = async () => {
      selectedIds.value = [];
      try {
        const req = await api.CheckConflict(props.dir);
        data.value = req.data.map((it, idx) => ({...it, key: idx}));
        load.value = false;
      } catch (e) {
        globalCapture(e, "Error checking for conflicts");
      }
    }

    onMounted(update)

    const requestDelete = async () => {
      load.value = true;
      try {
        const req = selectedIds.value.map(it => ({
          type: data.value[it].type,
          assetDir: data.value[it].upperDir,
          fileName: data.value[it].fileName,
        }));
        selectedIds.value = [];
        await api.DeleteAssets(req);
      } catch (e) {
        globalCapture(e, "Error deleting conflicting resources");
      }
      update();
    }

    return () => <NFlex size="large">
      <NButton onClick={requestDelete} disabled={!selectedIds.value.length}>Delete Selected</NButton>
      <NDataTable
        columns={columns}
        data={data.value}
        onUpdateCheckedRowKeys={keys => selectedIds.value = keys as number[]}
        loading={load.value}
        max-height="70vh"
      >{{
        empty: () => <div class="c-neutral">No conflicting resources</div>,
      }}</NDataTable>
    </NFlex>;
  }
})
