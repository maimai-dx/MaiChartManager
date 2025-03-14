import { computed, defineComponent, ref } from "vue";
import api, { getUrl } from "@/client/api";
import { globalCapture, selectedADir, selectedMusic, selectMusicId, showNeedPurchaseDialog, updateMusicList, version } from "@/store/refs";
import { NButton, NButtonGroup, NDropdown, useDialog, useMessage } from "naive-ui";
import { ZipReader } from "@zip.js/zip.js";
import ChangeIdDialog from "./ChangeIdDialog";
import getSubDirFile from "@/utils/getSubDirFile";

enum DROPDOWN_OPTIONS {
  export,
  exportZip,
  changeId,
  showExplorer,
  exportMaidata,
  exportMaidataIgnoreVideo,
  exportMaiDataZip,
  exportMaiDataZipIgnoreVideo,
}

export default defineComponent({
  setup() {
    const wait = ref(false);
    const dialog = useDialog();
    const message = useMessage();
    const showChangeId = ref(false);

    const options = computed(() => [
      {
        label: () => <a href={getUrl(`ExportOptApi/${selectedADir.value}/${selectMusicId.value}`)} download={`${selectMusicId.value} - ${selectedMusic.value?.name}.zip`}>Export Zip</a>,
        key: DROPDOWN_OPTIONS.exportZip,
      },
      {
        label: "Export as Maidata",
        key: DROPDOWN_OPTIONS.exportMaidata,
      },
      {
        label: () => <a href={getUrl(`ExportAsMaidataApi/${selectedADir.value}/${selectMusicId.value}`)} download={`${selectMusicId.value} - ${selectedMusic.value?.name} - Maidata.zip`}>Export Zip (Maidata)</a>,
        key: DROPDOWN_OPTIONS.exportMaiDataZip,
      },
      {
        label: "Export as Maidata (No BGA)",
        key: DROPDOWN_OPTIONS.exportMaidataIgnoreVideo,
      },
      {
        label: () => <a href={getUrl(`ExportAsMaidataApi/${selectedADir.value}/${selectMusicId.value}?ignoreVideo=true`)} download={`${selectMusicId.value} - ${selectedMusic.value?.name} - Maidata.zip`}>Export Zip (Maidata, No BGA)</a>,
        key: DROPDOWN_OPTIONS.exportMaiDataZipIgnoreVideo,
      },
      ...(selectedADir.value === 'A000' ? [] : [{
        label: 'Modify ID',
        key: DROPDOWN_OPTIONS.changeId,
      }]),
      {
        label: "Show in Explorer",
        key: DROPDOWN_OPTIONS.showExplorer,
      }
    ])

    const handleOptionClick = (key: DROPDOWN_OPTIONS) => {
      switch (key) {
        case DROPDOWN_OPTIONS.changeId:
          if (version.value?.license !== 'Active') {
            showNeedPurchaseDialog.value = true
            return
          }
          showChangeId.value = true;
          break;
        case DROPDOWN_OPTIONS.showExplorer:
          api.RequestOpenExplorer(selectMusicId.value, selectedADir.value);
          break;
        case DROPDOWN_OPTIONS.exportMaidata:
        case DROPDOWN_OPTIONS.exportMaidataIgnoreVideo:
          copy(key);
          break;
      }
    }

    const copy = async (type: DROPDOWN_OPTIONS) => {
      wait.value = true;
      if (location.hostname !== 'mcm.invalid' || type === DROPDOWN_OPTIONS.exportMaidata || type === DROPDOWN_OPTIONS.exportMaidataIgnoreVideo) {
        // Browser mode, use zip.js to fetch and decompress
        let folderHandle: FileSystemDirectoryHandle;
        try {
          folderHandle = await window.showDirectoryPicker({
            id: 'copyToSaveDir',
            mode: 'readwrite'
          });
        } catch (e) {
          wait.value = false;
          console.log(e)
          return;
        }
        try {
          let url = getUrl(`${type === DROPDOWN_OPTIONS.export ? 'ExportOptApi' : 'ExportAsMaidataApi'}/${selectedADir.value}/${selectMusicId.value}`);
          if (type === DROPDOWN_OPTIONS.exportMaidataIgnoreVideo) {
            url += '?ignoreVideo=true';
          }
          const zip = await fetch(url)
          const zipReader = new ZipReader(zip.body!);
          const entries = zipReader.getEntriesGenerator();
          for await (const entry of entries) {
            console.log(entry.filename);
            if (entry.filename.endsWith('/')) {
              continue;
            }
            const fileHandle = await getSubDirFile(folderHandle, entry.filename);
            const writable = await fileHandle.createWritable();
            await entry.getData!(writable);
          }
          message.success("Successful");
        } catch (e) {
          globalCapture(e, "Failed to export song (remote)");
        } finally {
          wait.value = false;
        }
        return;
      }
      try {
        // Opened locally in WebView, using local mode
        await api.RequestCopyTo({
          music: [{id: selectMusicId.value, assetDir: selectedADir.value}],
          removeEvents: false,
        });
      } finally {
        wait.value = false;
      }
    }

    return () =>
      <NButtonGroup>
        <NButton secondary onClick={() => copy(DROPDOWN_OPTIONS.export)} loading={wait.value}>
          Copy to...
        </NButton>
        <NDropdown options={options.value} trigger="click" placement="bottom-end" onSelect={handleOptionClick}>
          <NButton secondary class="px-.5 b-l b-l-solid b-l-[rgba(255,255,255,0.5)]">
            <span class="i-mdi-arrow-down-drop text-6 translate-y-.25"/>
          </NButton>
        </NDropdown>
        <ChangeIdDialog v-model:show={showChangeId.value}/>
      </NButtonGroup>
  }
});
