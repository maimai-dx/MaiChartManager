import { defineComponent, ref } from "vue";
import api from "@/client/api";
import { selectedADir, selectMusicId, updateMusicList } from "@/store/refs";
import { NButton, useDialog } from "naive-ui";

export default defineComponent({
  setup() {
    const deleteLoading = ref(false);
    const deleteConfirm = ref(false);
    const dialog = useDialog();

    const del = async () => {
      if (!deleteConfirm.value) {
        deleteConfirm.value = true;
        return;
      }
      deleteConfirm.value = false;
      deleteLoading.value = true;
      const res = await api.DeleteMusic(selectMusicId.value, selectedADir.value);
      if (res.error) {
        const error = res.error as any;
        dialog.warning({title: 'Deletion Failed', content: error.message || error});
        return;
      }
      selectMusicId.value = 0;
      updateMusicList();
    }


    return () => <NButton secondary onClick={del} loading={deleteLoading.value} type={deleteConfirm.value ? 'error' : 'default'}
      // @ts-ignore
                          onMouseleave={() => deleteConfirm.value = false}>
      {deleteConfirm.value ? 'Confirm' : 'Delete'}
    </NButton>;
  }
});
