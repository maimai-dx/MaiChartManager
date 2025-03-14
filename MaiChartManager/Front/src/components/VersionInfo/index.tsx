import { computed, defineComponent, ref } from "vue";
import { NA, NButton, NFlex, NModal, NPopover, NQrCode } from "naive-ui";
import '@fontsource/nerko-one'
import { version } from "@/store/refs";
import StorePurchaseButton from "@/components/StorePurchaseButton";
import AfdianIcon from "@/icons/afdian.svg";
import { HardwareAccelerationStatus, LicenseStatus } from "@/client/apiGen";

export default defineComponent({
  setup(props) {
    const show = ref(false);
    const displayVersion = computed(() => version.value?.version?.split('+')[0]);

    return () => version.value && <NButton quaternary round onClick={() => show.value = true}>
      v{displayVersion.value}

      <NModal
        preset="card"
        class="w-[min(45vw,60em)]"
        title="About"
        v-model:show={show.value}
      >
        <NFlex vertical class="text-4" size="large">
          <AppIcon class="mb-6"/>
          <div class="flex justify-center gap-1 text-10 c-gray-4">
            <a class="i-mdi-github hover:c-#1f2328 transition-300" href="https://github.com/clansty/MaiChartManager" target="_blank"/>
            <a class="i-ic-baseline-telegram hover:c-#39a6e6 transition-300" href="https://t.me/MaiChartManager" target="_blank"/>
            <NPopover trigger="hover">
              {{
                trigger: () => <div class="i-ri-qq-fill hover:c-#e31b25 transition-300"/>,
                default: () => <div><NQrCode value="https://qm.qq.com/q/xA4HgfhIM8"/></div>
              }}
            </NPopover>
          </div>
          <div>
            Version: {version.value.version}
          </div>
          <div>
            Game version: 1.{version.value.gameVersion}
          </div>
          {version.value.hardwareAcceleration === HardwareAccelerationStatus.Enabled && <div>
            VP9 hardware acceleration is in effect
          </div>}
          {version.value.hardwareAcceleration === HardwareAccelerationStatus.Disabled && <div>
            VP9 hardware acceleration is unavailable (enable Intel integrated graphics to accelerate video transcoding)
          </div>}
          <div>
            H264 encoder: {version.value.h264Encoder}
          </div>
          {version.value.license === LicenseStatus.Active && <div>
            Thank you for your support!
            <NA
              // @ts-ignore
              href="https://afdian.com/a/Clansty"
              target="_blank"
            >If you'd like to continue supporting, please click here</NA>
          </div>}
          {version.value.license === LicenseStatus.Inactive && <NFlex align="center">
            Support us to help development and gain more features
            <StorePurchaseButton/>
            <NButton secondary onClick={() => window.open("https://afdian.com/item/90b4d1fe70e211efab3052540025c377")}>
              <span class="text-lg c-#946ce6 mr-2 translate-y-.25">
                <AfdianIcon/>
              </span>
              Afdian
            </NButton>
          </NFlex>}
        </NFlex>
      </NModal>
    </NButton>;
  }
})

const AppIcon = defineComponent({
  setup() {
    return () => <div class="flex flex-col items-center font-['Nerko_One'] text-30 text-stroke-2 lh-none">
      <NFlex>
        <div class="c-#c3c4f8 text-stroke-#8791e2">
          Mai
        </div>
        <div class="c-#f7abca text-stroke-#d079b2">
          Chart
        </div>
      </NFlex>
      <div class="c-#fef19d text-stroke-#e3c86a">
        Manager
      </div>
    </div>
  }
})
