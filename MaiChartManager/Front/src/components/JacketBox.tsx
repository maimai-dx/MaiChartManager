import { computed, defineComponent, PropType, ref } from "vue";
import noJacket from "@/assets/noJacket.webp";
import api, { getUrl } from "@/client/api";
import { useDialog } from "naive-ui";
import { globalCapture, selectedADir, selectedMusic } from "@/store/refs";
import { MusicXmlWithABJacket } from "@/client/apiGen";

export default defineComponent({
  props: {
    info: {type: Object as PropType<MusicXmlWithABJacket>, required: true},
    upload: {type: Boolean, default: true}
  },
  setup(props) {
    const dialog = useDialog();
    const updateTime = ref(0)
    const jacketUrl = computed(() => props.info.hasJacket ?
      getUrl(`GetJacketApi/${props.info.assetDir}/${props.info.id}?${updateTime.value}`) : noJacket)

    const upload = async () => {
      if (!props.upload) return;
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          id: 'jacket',
          startIn: 'downloads',
          types: [
            {
              description: "Image",
              accept: {
                "application/jpeg": [".jpeg", ".jpg"],
                "application/png": [".png"],
              },
            },
          ],
        });

        if (!fileHandle) return;
        const file = await fileHandle.getFile();

        const res = await api.SetMusicJacket(props.info.id!, selectedADir.value, {file});
        if (res.error) {
          const error = res.error as any;
          dialog.warning({title: 'Setting failed', content: error.message || error});
          return;
        }
        if (res.data) {
          dialog.info({title: 'Setting failed', content: res.data})
          return;
        }
        updateTime.value = Date.now()
        props.info.hasJacket = true;
        selectedMusic.value!.hasJacket = true;
        (selectedMusic.value as any).updateTime = updateTime.value
      } catch (e: any) {
        if (e.name === 'AbortError') return
        console.log(e)
        globalCapture(e, "Failed to replace image")
      }
    }

    return () => <img src={jacketUrl.value} class={`object-fill rounded-lg ${props.upload && 'cursor-pointer'}`} onClick={upload}/>
  }
})
