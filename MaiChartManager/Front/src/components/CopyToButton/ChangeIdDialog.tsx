import { computed, defineComponent, ref, watch } from "vue";
import { DialogOptions, NButton, NFlex, NForm, NFormItem, NInputNumber, NModal, useDialog } from "naive-ui";
import { globalCapture, musicList, selectedADir, selectMusicId, updateAll } from "@/store/refs";
import api from "@/client/api";
import MusicIdConflictNotifier from "@/components/MusicIdConflictNotifier";

export default defineComponent({
  props: {
    show: Boolean,
  },
  setup(props, {emit}) {
    const show = computed({
      get: () => props.show,
      set: (val) => emit('update:show', val)
    })
    const id = ref(0);
    watch(() => show.value, val => {
      if (!val) return;
      id.value = selectMusicId.value;
    })
    const dialog = useDialog();
    const loading = ref(false);

    const awaitDialog = (options: DialogOptions) => new Promise<boolean>(resolve => {
      dialog.create({
        ...options,
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
      });
    })

    const save = async () => {
      if (musicList.value.find(it => it.id === id.value)) {
        const choice = await awaitDialog({
          type: 'warning',
          title: 'ID already exists',
          content: 'Do you want to overwrite?',
          positiveText: 'Overwrite',
          negativeText: 'Cancel',
        });
        if (!choice) return;
      }
      if (Math.floor(id.value / 1e4) !== Math.floor(selectMusicId.value / 1e4)) {
        const choice = await awaitDialog({
          type: 'warning',
          title: 'Continuing may alter the song attributes',
          content: 'For example, it might affect whether it is a DX chart or a standard chart, or party mode, etc. Do you still want to continue?',
          positiveText: 'Continue',
          negativeText: 'Cancel',
        });
        if (!choice) return;
      }
      try {
        loading.value = true;
        await api.ModifyId(selectMusicId.value, selectedADir.value, id.value);
        await updateAll();
        selectMusicId.value = id.value;
        show.value = false;
      } catch (e) {
        globalCapture(e, 'An error occurred while modifying the ID');
      } finally {
        loading.value = false;
      }
    }

    return () => <NModal
      preset="card"
      class="w-[min(30vw,25em)]"
      title="Change ID"
      v-model:show={show.value}
    >{{
      default: () => <NForm label-placement="left" labelWidth="5em" showFeedback={false} disabled={loading.value}>
        <NFlex vertical size="large">
          <NFormItem label="New ID">
            <NFlex align="center" wrap={false}>
              <NInputNumber v-model:value={id.value} class="w-full" min={1} max={999999}/>
              <MusicIdConflictNotifier id={id.value}/>
            </NFlex>
          </NFormItem>
        </NFlex>
      </NForm>,
      footer: () => <NFlex justify="end">
        <NButton onClick={save} disabled={id.value === selectMusicId.value} loading={loading.value}>Confirm</NButton>
      </NFlex>
    }}</NModal>;
  }
})
