import { defineComponent, PropType, ref } from "vue";
import { NButton, NCheckbox, NFlex, NForm, NFormItem, NSelect } from "naive-ui";
import GenreInput from "@/components/GenreInput";
import { addVersionList, genreList, globalCapture, selectedADir, selectMusicId, updateMusicList, version } from "@/store/refs";
import api from "@/client/api";
import { MusicXmlWithABJacket } from "@/client/apiGen";

enum VERSION_OPTION {
  NotChange,
  B35,
  B15
}

const versionOptions = [
  {label: 'Do Not Modify', value: VERSION_OPTION.NotChange},
  {label: 'B35', value: VERSION_OPTION.B35},
  {label: 'B15', value: VERSION_OPTION.B15},
]

export default defineComponent({
  props: {
    closeModal: {type: Function, required: true},
    selectedMusicIds: {type: Array as PropType<MusicXmlWithABJacket[]>, required: true}
  },
  setup(props) {
    const versionOpt = ref(VERSION_OPTION.NotChange);
    const addVersion = ref(-1);
    const genre = ref(-1);
    const removeLevels = ref(false);
    const loading = ref(false);

    const save = async () => {
      loading.value = true;
      try {
        let newVersion = -1;
        if (versionOpt.value === VERSION_OPTION.B35) {
          newVersion = 20000;
        } else if (versionOpt.value === VERSION_OPTION.B15) {
          newVersion = version.value!.gameVersion! * 100 + 20000;
        }
        await api.BatchSetProps({
          ids: props.selectedMusicIds.map(id => ({id: id.id, assetDir: id.assetDir})),
          genreId: genre.value,
          version: newVersion,
          addVersionId: addVersion.value,
          removeLevels: removeLevels.value
        })
        props.closeModal();
        selectMusicId.value = 0;
        updateMusicList();
      } catch (e) {
        globalCapture(e, "Batch modification failed");
      } finally {
        loading.value = false;
      }
    }

    return () => <NForm showFeedback={false} labelPlacement="top" disabled={loading.value}>
      <NFlex vertical>
        <NFormItem label="Version">
          <NSelect v-model:value={versionOpt.value} options={versionOptions}/>
        </NFormItem>
        <NFormItem label="Genre">
          <GenreInput options={[
            {id: -1, genreName: 'Do Not Modify'},
            ...genreList.value
          ]} v-model:value={genre.value}/>
        </NFormItem>
        <NFormItem label="Version Category">
          <GenreInput options={[
            {id: -1, genreName: 'Do Not Modify'},
            ...addVersionList.value
          ]} v-model:value={addVersion.value}/>
        </NFormItem>
        <NCheckbox v-model:checked={removeLevels.value}>Remove difficulty values, exclude from B50</NCheckbox>
        <NFlex justify="end">
          <NButton loading={loading.value} onClick={save}>Save</NButton>
        </NFlex>
      </NFlex>
    </NForm>
  }
})
