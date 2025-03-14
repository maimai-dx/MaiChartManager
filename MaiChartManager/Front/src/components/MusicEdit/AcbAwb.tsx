import { computed, defineComponent, PropType, ref } from "vue";
import { HttpResponse, MusicXmlWithABJacket } from "@/client/apiGen";
import { NButton, NDrawer, NDrawerContent, NFlex, NForm, NFormItem, NInputNumber, NModal, NRadio, useDialog } from "naive-ui";
import noJacket from "@/assets/noJacket.webp";
import { globalCapture, selectedADir } from "@/store/refs";
import FileTypeIcon from "@/components/FileTypeIcon";
import stdIcon from "@/assets/stdIcon.png";
import dxIcon from "@/assets/dxIcon.png";
import api, { getUrl } from "@/client/api";
import AudioPreviewEditorButton from "@/components/MusicEdit/AudioPreviewEditorButton";
import SetMovieButton from "@/components/MusicEdit/SetMovieButton";

export default defineComponent({
  props: {
    song: {type: Object as PropType<MusicXmlWithABJacket>, required: true},
  },
  setup(props) {
    const updateTime = ref(0)
    const url = computed(() => getUrl(`GetMusicWavApi/${selectedADir.value}/${props.song.id}?${updateTime.value}`))
    const tipShow = ref(false)
    const tipSelectAwbShow = ref(false)
    const setOffsetShow = ref(false)
    const offset = ref(0)
    const load = ref(false)
    const okResolve = ref<Function>(() => {
    })
    const dialog = useDialog();

    const uploadFlow = async () => {
      tipShow.value = true
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          id: 'acbawb',
          startIn: 'downloads',
          types: [
            {
              description: "Supported file types",
              accept: {
                "application/x-supported": [".mp3", ".wav", ".ogg", ".acb"],
              },
            },
          ],
        });
        tipShow.value = false;
        if (!fileHandle) return;
        const file = await fileHandle.getFile() as File;

        let res: HttpResponse<any>;
        if (file.name.endsWith('.acb')) {
          tipSelectAwbShow.value = true;
          const [fileHandle] = await window.showOpenFilePicker({
            id: 'acbawb',
            startIn: 'downloads',
            types: [
              {
                description: "Supported file types",
                accept: {
                  "application/x-supported": [".awb"],
                },
              },
            ],
          });
          tipSelectAwbShow.value = false;
          if (!fileHandle) return;

          load.value = true;
          const awb = await fileHandle.getFile() as File;
          res = await api.SetAudio(props.song.id!, selectedADir.value, {file, awb, padding: 0});
        } else {
          offset.value = 0;
          setOffsetShow.value = true;
          await new Promise((resolve) => {
            okResolve.value = resolve;
          });
          load.value = true;
          setOffsetShow.value = false;
          res = await api.SetAudio(props.song.id!, selectedADir.value, {file, padding: offset.value});
        }
        if (res.error) {
          const error = res.error as any;
          dialog.warning({title: 'Setting failed', content: error.message || error});
          return;
        }
        updateTime.value = Date.now()
        props.song.isAcbAwbExist = true;
      } catch (e: any) {
        if (e.name === 'AbortError') return
        console.log(e)
        globalCapture(e, "Error importing audio")
      } finally {
        tipShow.value = false;
        tipSelectAwbShow.value = false;
        setOffsetShow.value = false;
        load.value = false;
      }
    }

    return () => <NFlex align="center">
      {props.song.isAcbAwbExist && <audio controls src={url.value} class="w-0 grow"/>}
      {selectedADir.value !== 'A000' && <NButton secondary class={`${!props.song.isAcbAwbExist && "w-full"}`} onClick={uploadFlow} loading={load.value}>{props.song.isAcbAwbExist ? 'Replace' : 'Set'} Audio</NButton>}
      {selectedADir.value !== 'A000' && props.song.isAcbAwbExist && <AudioPreviewEditorButton/>}
      {selectedADir.value !== 'A000' && props.song.isAcbAwbExist && <SetMovieButton song={props.song}/>}

      {/* The file dialog usually pops up in the top-left corner, so we show a Drawer below */}
      <NDrawer v-model:show={tipShow.value} height={200} placement="bottom">
        <NDrawerContent title="File types you can select from">
          <div class="grid cols-4 justify-items-center text-8em gap-10">
            <FileTypeIcon type="WAV"/>
            <FileTypeIcon type="MP3"/>
            <FileTypeIcon type="OGG"/>
            <FileTypeIcon type="ACB"/>
          </div>
        </NDrawerContent>
      </NDrawer>
      <NDrawer v-model:show={tipSelectAwbShow.value} width={500} placement="right">
        <NDrawerContent title="Please select the corresponding AWB file"/>
      </NDrawer>
      <NModal
        preset="card"
        class="w-[min(30vw,25em)]"
        title="Set offset (seconds)"
        v-model:show={setOffsetShow.value}
      >{{
        default: () => <NFlex vertical size="large">
          <div>Setting a positive value adds silence to the beginning of the song, setting a negative value removes part of the beginning.</div>
          <NInputNumber v-model:value={offset.value} class="w-full" step={0.01}/>
        </NFlex>,
        footer: () => <NFlex justify="end">
          <NButton onClick={okResolve.value as any}>Confirm</NButton>
        </NFlex>
      }}</NModal>
    </NFlex>
  }
})
