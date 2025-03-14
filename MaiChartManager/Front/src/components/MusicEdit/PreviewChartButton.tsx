import { defineComponent, PropType, ref, watch } from "vue";
import UnityWebgl from "unity-webgl";
// Interestingly, placing a .data file in ASP.NET's wwwroot results in a 404 error, while other file extensions do not have this issue
import dataUrl from '@/assets/majdata-wasm/Build.bin?url';
import frameworkUrl from '@/assets/majdata-wasm/Build.framework.js?url';
import codeUrl from '@/assets/majdata-wasm/Build.wasm?url';
import loaderUrl from '@/assets/majdata-wasm/Build.loader.js?url';
import { NButton, NFlex, NInputNumber, NModal } from "naive-ui";
import UnityVue from 'unity-webgl/vue'
import { selectedADir } from "@/store/refs";
import { getUrl } from "@/client/api";

export default defineComponent({
  props: {
    songId: {type: Number, required: true},
    level: {type: Number, required: true},
  },
  setup(props) {
    const unityContext = new UnityWebgl({
      dataUrl,
      frameworkUrl,
      loaderUrl,
      codeUrl,
    })
    const show = ref(false)

    unityContext.on("mounted", () => {
      console.log("Unity mounted")
      setTimeout(() => {
        unityContext.send("HandleJSMessages", "ReceiveMessage", `jsnmsl\n${getUrl(`ChartPreviewApi/${selectedADir.value}/${props.songId}/${props.level}`)}\n1\nlv0`)
      }, 3000)
    })

    return () => <NButton secondary onClick={() => show.value = true}>
      Preview Chart
      <NModal
        preset="card"
        class="w-60vw"
        title="Chart Preview"
        v-model:show={show.value}
      >
        <NFlex vertical>
          The chart preview does not represent the in-game experience, please consider the actual version as final.
          <UnityVue unity={unityContext} height="32vw"/>
        </NFlex>
      </NModal>

    </NButton>
  },
})
