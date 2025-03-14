import { computed, defineComponent } from "vue";
import { NDrawer, NDrawerContent, NFlex } from "naive-ui";
import FileTypeIcon from "@/components/FileTypeIcon";
import FileContentIcon from "@/components/FileContentIcon";

export default defineComponent({
  props: {
    show: {type: Boolean, required: true},
  },
  setup(props, {emit}) {
    return () => <NDrawer show={props.show} height={250} placement="bottom">
      <NDrawerContent title="Selectable File Types">
        <NFlex vertical size="large">
          The image ratio doesn’t matter, but it’s best to have a horizontally transparent PNG image of roughly that ratio. A resolution of around 332x160 is best.
          <div class="grid cols-4 justify-items-center text-8em gap-10">
            <FileTypeIcon type="JPG"/>
            <FileTypeIcon type="PNG"/>
          </div>
        </NFlex>
      </NDrawerContent>
    </NDrawer>;
  }
})
