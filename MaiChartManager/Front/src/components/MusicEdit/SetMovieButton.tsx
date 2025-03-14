import { defineComponent, PropType, ref } from "vue";
import { NButton, NCheckbox, NDrawer, NDrawerContent, NFlex, NFormItem, NInputNumber, NModal, NProgress, NSelect, useDialog, useMessage } from "naive-ui";
import FileTypeIcon from "@/components/FileTypeIcon";
import { LicenseStatus, MusicXmlWithABJacket } from "@/client/apiGen";
import api, { getUrl } from "@/client/api";
import { aquaMaiConfig, globalCapture, selectedADir, showNeedPurchaseDialog, version } from "@/store/refs";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { defaultSavedOptions, MOVIE_CODEC } from "@/components/ImportCreateChartButton/ImportChartButton/types";
import { useStorage } from "@vueuse/core";

enum STEP {
  None,
  Select,
  Offset,
  Progress,
}

export default defineComponent({
  props: {
    song: {type: Object as PropType<MusicXmlWithABJacket>, required: true},
  },
  setup(props) {
    const offset = ref(0)
    const load = ref(false)
    const okResolve = ref<Function>(() => {
    })
    const dialog = useDialog();
    const step = ref(STEP.None)
    const progress = ref(0)
    const message = useMessage();
    const noScale = ref(false)
    const savedOptions = useStorage('importMusicOptions', defaultSavedOptions, undefined, {mergeDefaults: true});

    const shouldUseH264 = () => {
      if (savedOptions.value.movieCodec === MOVIE_CODEC.ForceH264) return true;
      if (savedOptions.value.movieCodec === MOVIE_CODEC.ForceVP9) return false;
      return aquaMaiConfig.value?.sectionStates?.['GameSystem.Assets.MovieLoader']?.enabled && aquaMaiConfig.value?.entryStates?.['GameSystem.Assets.MovieLoader.LoadMp4Movie']?.value;
    }

    const uploadMovie = (id: number, movie: File, offset: number) => new Promise<void>((resolve, reject) => {
      progress.value = 0;
      const body = new FormData();
      const h264 = shouldUseH264();
      console.log('use h264', h264);
      body.append('h264', h264.toString());
      body.append('file', movie);
      body.append('padding', offset.toString());
      body.append('noScale', noScale.value.toString());
      const controller = new AbortController();
      fetchEventSource(getUrl(`SetMovieApi/${selectedADir.value}/${id}`), {
        signal: controller.signal,
        method: 'PUT',
        body,
        onerror(e) {
          reject(e);
          controller.abort();
          throw new Error("disable retry onerror");
        },
        onclose() {
          reject(new Error("EventSource Close"));
          controller.abort();
          throw new Error("disable retry onclose");
        },
        openWhenHidden: true,
        onmessage: (e) => {
          switch (e.event) {
            case 'Progress':
              progress.value = parseInt(e.data);
              break;
            case 'Success':
              console.log("success")
              controller.abort();
              resolve();
              break;
            case 'Error':
              controller.abort();
              reject(new Error(e.data));
              break;
          }
        }
      });
    })

    const uploadFlow = async () => {
      step.value = STEP.Select
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          id: 'movie',
          startIn: 'downloads',
          types: [
            {
              description: "Supported File Types",
              accept: {
                "video/*": [".dat"],
                "image/*": [],
              },
            },
          ],
        });
        step.value = STEP.None
        if (!fileHandle) return;
        const file = await fileHandle.getFile() as File;

        if (file.name.endsWith('.dat')) {
          load.value = true;
          await api.SetMovie(props.song.id!, selectedADir.value, {file, padding: 0});
        } else if (version.value?.license !== LicenseStatus.Active) {
          showNeedPurchaseDialog.value = true;
        } else {
          offset.value = 0;
          if (file.type.startsWith("video/")) {
            step.value = STEP.Offset
            await new Promise((resolve) => {
              okResolve.value = resolve;
            });
          }
          load.value = true;
          progress.value = 0;
          step.value = STEP.Progress
          await uploadMovie(props.song.id!, file, offset.value);
          console.log("upload movie success");
          message.success("Saved Successfully");
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.log(e)
        globalCapture(e, "Error Importing PV");
      } finally {
        step.value = STEP.None
        load.value = false;
      }
    }

    return () => <NButton secondary onClick={uploadFlow} loading={load.value}>
      Set PV

      <NDrawer show={step.value === STEP.Select} height={250} placement="bottom">
        <NDrawerContent title="Selectable File Types">
          <NFlex vertical>
            Any video format supported by FFmpeg or a single image (sponsor version feature), or a DAT file converted by yourself
            <div class="grid cols-4 justify-items-center text-8em gap-10">
              <FileTypeIcon type="MP4"/>
              <FileTypeIcon type="JPG"/>
              <FileTypeIcon type="DAT"/>
            </div>
          </NFlex>
        </NDrawerContent>
      </NDrawer>
      <NModal
        preset="card"
        class="w-[min(30vw,25em)]"
        title="Set Offset (Seconds)"
        show={step.value === STEP.Offset}
        onUpdateShow={() => (step.value = STEP.None)}
      >{{
        default: () => <NFlex vertical size="large">
          <div>If you set a positive number, black padding will be added in front of the video. If you set a negative number, part of the beginning of the video will be cut.</div>
          <NInputNumber v-model:value={offset.value} class="w-full" step={0.01}/>
          <NCheckbox v-model:checked={noScale.value}>
            Do Not Scale BGA to 1080 Width
          </NCheckbox>
          <NFormItem label="PV Encoding" labelPlacement="left" showFeedback={false}>
            <NFlex vertical class="w-full">
              <NFlex class="h-34px" align="center">
                <NSelect v-model:value={savedOptions.value.movieCodec} options={[
                  {label: "Prefer H264", value: MOVIE_CODEC.PreferH264},
                  {label: "Force H264", value: MOVIE_CODEC.ForceH264},
                  {label: "Force VP9 USM", value: MOVIE_CODEC.ForceVP9},
                ]}/>
              </NFlex>
            </NFlex>
          </NFormItem>
        </NFlex>,
        footer: () => <NFlex justify="end">
          <NButton onClick={okResolve.value as any}>Confirm</NButton>
        </NFlex>
      }}</NModal>
      <NModal
        preset="card"
        class="w-[min(40vw,40em)]"
        title="Converting…"
        show={step.value === STEP.Progress}
        closable={false}
        maskClosable={false}
        closeOnEsc={false}
      >
        <NProgress
          type="line"
          status="success"
          percentage={progress.value}
          indicator-placement="inside"
          processing
        >
          {progress.value === 100 ? "Still processing, please wait..." : `${progress.value}%`}
        </NProgress>
      </NModal>
    </NButton>;
  }
})
