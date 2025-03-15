import { defineComponent, ref } from "vue";
import { NButton, NModal } from "naive-ui";
import CheckContent from "@/components/AssetDirsManager/CheckConflictButton/CheckContent";

export default defineComponent({
  props: {
    dir: {type: String, required: true}
  },
  setup(props) {
    const show = ref(false);

    return () => <NButton secondary onClick={() => show.value = true}>
      Check Conflicts

      <NModal
        preset="card"
        class="w-[min(60vw,60em)]"
        title="Resource Conflict Check"
        v-model:show={show.value}
      >
        <CheckContent dir={props.dir}/>
      </NModal>
    </NButton>;
  }
})
