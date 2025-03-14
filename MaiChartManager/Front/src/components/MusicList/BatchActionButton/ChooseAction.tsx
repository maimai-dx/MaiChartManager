import { defineComponent, PropType, ref } from "vue";
import { MusicXmlWithABJacket } from "@/client/apiGen";
import { NButton, NFlex, NPopover, NRadio, NRadioGroup, useMessage, useNotification } from "naive-ui";
import { STEP } from "@/components/MusicList/BatchActionButton/index";
import api from "@/client/api";
import { showNeedPurchaseDialog, updateMusicList, version } from "@/store/refs";
import remoteExport from "@/components/MusicList/BatchActionButton/remoteExport";

export enum OPTIONS {
  None,
  EditProps,
  Delete,
  CreateNewOpt,
  CreateNewOptCompatible,
  ConvertToMaidata,
  ConvertToMaidataIgnoreVideo,
  CreateNewOptMa2_103,
}

export default defineComponent({
  props: {
    selectedMusic: Array as PropType<MusicXmlWithABJacket[]>,
    continue: {type: Function, required: true},
  },
  setup(props) {
    const selectedOption = ref(OPTIONS.None);
    const load = ref(false);
    const notify = useNotification();

    const proceed = async () => {
      switch (selectedOption.value) {
        case OPTIONS.EditProps:
          props.continue(STEP.EditProps);
          break;
        case OPTIONS.Delete:
          load.value = true;
          await api.BatchDeleteMusic(props.selectedMusic!);
          await updateMusicList();
          props.continue(STEP.None);
          break;
        case OPTIONS.CreateNewOpt:
        case OPTIONS.CreateNewOptCompatible:
          if (location.hostname === 'mcm.invalid') {
            props.continue(STEP.None);
            await api.RequestCopyTo({music: props.selectedMusic, removeEvents: selectedOption.value === OPTIONS.CreateNewOptCompatible, legacyFormat: false});
            break;
          }
        case OPTIONS.CreateNewOptMa2_103:
          if (location.hostname === 'mcm.invalid') {
            props.continue(STEP.None);
            await api.RequestCopyTo({music: props.selectedMusic, removeEvents: true, legacyFormat: true});
            break;
          }
        case OPTIONS.ConvertToMaidata:
        case OPTIONS.ConvertToMaidataIgnoreVideo:
          if (version.value?.license !== 'Active') {
            showNeedPurchaseDialog.value = true
            break;
          }
          remoteExport(props.continue as any, props.selectedMusic!, selectedOption.value, notify);
          break;
      }
    }

    return () => <NFlex vertical>
      <NRadioGroup v-model:value={selectedOption.value} disabled={load.value}>
        <NFlex vertical>
          {
            props.selectedMusic?.some(it => it.assetDir === 'A000') ? (
              <>
                <NPopover trigger="hover" placement="top-start">{{
                  trigger: () =>
                    <NRadio disabled>
                      Edit properties
                    </NRadio>,
                    default: () => "You've selected songs from the A000 directory",
                  }}
                  }}</NPopover>
                <NPopover trigger="hover" placement="top-start">{{
                  trigger: () =>
                    <NRadio disabled>
                      Delete
                    </NRadio>,
                    default: () => "You've selected songs from the A000 directory",
                }}</NPopover>
              </> :
              <>
                <NRadio value={OPTIONS.EditProps}>{OPTIONS.EditProps}>
                  Edit properties
                </NRadio>
                <NRadio value={OPTIONS.Delete}>
                  Delete
                </NRadio>
              </>
          )}
          <NRadio value={OPTIONS.CreateNewOpt}>
            Export as Opt (Original
          </NRadio>
          <NRadio value={OPTIONS.CreateNewOptCompatible}>
            Export as Opt (Preserve chart format, remove Events, etc.)
          </NRadio>
          <NRadio value={OPTIONS.CreateNewOptMa2_103}>
            Export as Opt (Ma2 103 format, remove Events, etc.)
          </NRadio>
          <NRadio value={OPTIONS.ConvertToMaidata}>
            Convert to Maidata
          </NRadio>
          <NRadio value={OPTIONS.ConvertToMaidataIgnoreVideo}>
            Convert to Maidata (no BGA)
          </NRadio>
        </NFlex>
      </NRadioGroup>
      <NFlex justify="end">
          <NButton onClick={() => props.continue(STEP.Select)} disabled={load.value}>Previous Step</NButton>
          <NButton onClick={proceed} loading={load.value} disabled={selectedOption.value === OPTIONS.None}>Continue</NButton>
      </NFlex>
    </NFlex>;
  }
})
