import { computed, defineComponent, PropType } from "vue";
import { GetAssetsDirsResult } from "@/client/apiGen";
import { NFlex, NPopover } from "naive-ui";
import OfficialChartToggle from "@/components/AssetDirsManager/OfficialChartToggle";
import MemosDisplay from "@/components/AssetDirsManager/MemosDisplay";
import DeleteButton from "@/components/AssetDirsManager/DeleteButton";
import CheckConflictButton from "@/components/AssetDirsManager/CheckConflictButton";

export default defineComponent({
  props: {
    dir: {type: Object as PropType<GetAssetsDirsResult>, required: true}
  },
  setup(props) {

    return () => <div class="grid cols-[10em_1fr_9em_6em_14em] items-center gap-5 m-x">
      {props.dir.dirName}
      <div/>
      <div>
        {
          props.dir.subFiles!.some(it => it === 'DataConfig.xml') ?
            <NPopover trigger="hover">
              {{
                trigger: () => "Stores Official Charts",
                default: () => "Because DataConfig.xml exists, this directory will be marked as storing official charts"
              }}
            </NPopover> :
            <OfficialChartToggle dir={props.dir}/>
        }
      </div>
      <div>
        <MemosDisplay dir={props.dir}/>
      </div>
      <NFlex>
        {props.dir.dirName! !== 'A000' && <>
            <DeleteButton dir={props.dir}/>
            <CheckConflictButton dir={props.dir.dirName!}/>
        </>}
      </NFlex>
    </div>;
  }
})
