import { defineComponent, PropType } from "vue";
import { NFlex, NPopover } from "naive-ui";
import { MusicXmlWithABJacket } from "@/client/apiGen";
import OverrideUpIcon from '@/icons/override-up.svg'
import OverrideDownIcon from '@/icons/override-down.svg'

export default defineComponent({
  props: {
    conflicts: {type: Array as PropType<MusicXmlWithABJacket[]>, required: true},
    type: {type: String, required: true},
  },
  setup(props) {
    return () => !!props.conflicts.length && <NPopover trigger="hover">
      {{
        trigger: () => props.type === 'up' ?
          // @ts-ignore
          <OverrideUpIcon class="c-blue text-2em"/> : <OverrideDownIcon class="c-indigo text-2em"/>,
        default: () => <NFlex vertical>
          {props.type === 'up' ? 'Overrode the songs with the same ID in the following directories' : 'Was overridden by the songs with the same ID in the following directories'}
          {props.conflicts!.map((p, index) => <div key={index}>{p.assetDir}</div>)}
        </NFlex>
      }}
    </NPopover>;
  }
})
