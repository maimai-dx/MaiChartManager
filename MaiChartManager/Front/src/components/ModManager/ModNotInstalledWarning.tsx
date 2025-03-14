import { computed, defineComponent } from "vue";
import { NButton, NFlex, NModal } from "naive-ui";

export default defineComponent({
  props: {
    show: {type: Boolean, required: true},
    closeModal: {type: Function, required: true}
  },
  setup(props, {emit}) {
    const show = computed({
      get: () => props.show,
      set: (val) => props.closeModal()
    })
    return () => <NModal
      preset="card"
      class="w-[min(35vw,45em)]"
      title="AquaMai Not Installed"
      v-model:show={show.value}
    >{{
      default: () => "MelonLoader or AquaMai is not installed, so the game will be unable to load song covers. Please click Mod Management to install it.",
      footer: () => <NFlex justify="end">
        <NButton onClick={() => props.closeModal(true)}>Don't show again</NButton>
      </NFlex>
    }}</NModal>;
  }
})
