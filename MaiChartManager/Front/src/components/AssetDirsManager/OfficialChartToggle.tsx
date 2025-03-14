import { computed, defineComponent, PropType } from "vue";
import { GetAssetsDirsResult } from "@/client/apiGen";
import api from "@/client/api";
import { updateAssetDirs } from "@/store/refs";
import { NButton } from "naive-ui";

export default defineComponent({
  props: {
    dir: {type: Object as PropType<GetAssetsDirsResult>, required: true}
  },
  setup(props) {
    const isOfficialChart = computed(() => props.dir.subFiles!.some(it => it === 'OfficialChartsMark.txt'));
    const toggleSelfMadeChart = async () => {
      if (isOfficialChart.value) {
        await api.DeleteAssetDirTxt({
          dirName: props.dir.dirName,
          fileName: 'OfficialChartsMark.txt'
        });
      } else {
        await api.PutAssetDirTxtValue({
          dirName: props.dir.dirName,
          fileName: 'OfficialChartsMark.txt',
          content: 'Used by AquaMai to indicate that this directory stores official charts'
        });
      }
      await updateAssetDirs();
    }

    return () => <NButton secondary onClick={toggleSelfMadeChart}>
      <span class="i-material-symbols-repeat text-lg m-r-1"/>
      Store
      {isOfficialChart.value ? 'Official Chart' : 'User-made Chart'}
    </NButton>;
  }
})
