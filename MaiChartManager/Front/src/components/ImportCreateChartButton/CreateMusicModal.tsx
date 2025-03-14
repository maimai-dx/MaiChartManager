import { computed, defineComponent, ref, watch } from "vue";
import { NButton, NFlex, NForm, NFormItem, NInputNumber, NModal, NRadio, NSelect } from "naive-ui";
import { assetDirs, musicList, selectedADir, selectMusicId, updateMusicList } from "@/store/refs";
import dxIcon from "@/assets/dxIcon.png";
import stdIcon from "@/assets/stdIcon.png";
import api from "@/client/api";
import MusicIdConflictNotifier from "@/components/MusicIdConflictNotifier";
import getNextUnusedMusicId from "@/utils/getNextUnusedMusicId";

export default defineComponent({
  props: {
    show: Boolean,
    closeModal: {type: Function, required: true},
  },
  setup(props) {
    const show = computed({
      get: () => props.show,
      set: (val) => props.closeModal()
    })
    const id = ref(0);

    watch(() => show.value, (newValue, oldValue) => {
      if (!newValue) return;
      id.value = getNextUnusedMusicId();
    })

    const save = async () => {
      show.value = false;
      await api.AddMusic(id.value, selectedADir.value);
      await updateMusicList();
      selectMusicId.value = id.value;
    }

    return () => (
      <NModal
        preset="card"
        class="w-[min(30vw,25em)]"
        title={`Create Song`}
        v-model:show={show.value}
      >{{
        default: () => <NForm label-placement="left" labelWidth="5em" showFeedback={false}>
          <NFlex vertical size="large">
            <NFormItem label="ID">
              <NFlex align="center" wrap={false}>
                <NInputNumber v-model:value={id.value} class="w-full" min={1} max={2e4 - 1}/>
                <MusicIdConflictNotifier id={id.value}/>
              </NFlex>
            </NFormItem>
            <NFormItem label="Chart Type">
              <NFlex>
                <NRadio checked={id.value < 1e4} onUpdateChecked={() => id.value -= 1e4}>
                  <img src={stdIcon} class="h-1.5em mt--0.6"/>
                </NRadio>
                <NRadio checked={id.value >= 1e4} onUpdateChecked={() => id.value += 1e4}>
                  <img src={dxIcon} class="h-1.5em mt--0.6"/>
                </NRadio>
              </NFlex>
            </NFormItem>
          </NFlex>
        </NForm>,
        footer: () => <NFlex justify="end">
          <NButton onClick={save}>Confirm</NButton>
        </NFlex>
      }}</NModal>
    );
  }
});
