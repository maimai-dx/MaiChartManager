import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { NButton, NCheckbox, NFlex, NModal, NSwitch, useDialog } from "naive-ui";
import api from "@/client/api";
import { globalCapture, modInfo, updateModInfo, updateMusicList, aquaMaiConfig as config } from "@/store/refs";
import AquaMaiConfigurator from "./AquaMaiConfigurator";
import { shouldShowUpdate } from "./shouldShowUpdateController";
import { useStorage } from "@vueuse/core";

export default defineComponent({
  props: {
    show: Boolean,
    disableBadge: Boolean,
    badgeType: String,
  },
  setup(props, { emit }) {
    const show = computed({
      get: () => props.show,
      set: (val) => emit('update:show', val)
    })
    const disableBadge = computed({
      get: () => props.disableBadge,
      set: (val) => emit('update:disableBadge', val)
    })

    const configReadErr = ref('')
    const configReadErrTitle = ref('')
    const dialog = useDialog()
    const installingMelonLoader = ref(false)
    const installingAquaMai = ref(false)
    const showAquaMaiInstallDone = ref(false)
    const useNewSort = useStorage('useNewSort', true)

    const updateAquaMaiConfig = async () => {
      try {
        configReadErr.value = ''
        configReadErrTitle.value = ''
        config.value = (await api.GetAquaMaiConfig()).data;
      } catch (err: any) {
        if (err instanceof Response) {
          if (!err.bodyUsed) {
            const text = await err.text();
            try {
              const json = JSON.parse(text);
              if (json.detail) {
                configReadErr.value = json.detail;
              }
              if (json.title) {
                configReadErrTitle.value = json.title;
              }
              return
            } catch {
            }
            configReadErr.value = text.split('\n')[0];
            return
          }
        }
        if (err.error instanceof Error) {
          configReadErr.value = err.error.message.split('\n')[0];
          return
        }
        if (err.error) {
          configReadErr.value = err.error.toString().split('\n')[0];
          return
        }
        configReadErr.value = err.toString().split('\n')[0];
      }
    }

    onMounted(updateAquaMaiConfig)

    const installMelonLoader = async () => {
      try {
        installingMelonLoader.value = true
        await api.InstallMelonLoader()
        await updateModInfo()
      } catch (e: any) {
        globalCapture(e, "Failed to install MelonLoader")
      } finally {
        installingMelonLoader.value = false
      }
    }

    const installAquaMai = async () => {
      try {
        // But you won't even see this loading icon, because it's too fast.
        installingAquaMai.value = true
        await api.InstallAquaMai()
        await updateModInfo()
        await updateAquaMaiConfig()
        showAquaMaiInstallDone.value = true
        setTimeout(() => showAquaMaiInstallDone.value = false, 3000);
      } catch (e: any) {
        globalCapture(e, "Failed to install AquaMai, the files might be in use?")
      } finally {
        installingAquaMai.value = false
      }
    }

    watch(() => show.value, async (val) => {
      if (configReadErr.value) return
      if (!val && config.value) {
        try {
          await api.SetAquaMaiConfig(config.value)
          await updateMusicList()
        } catch (e) {
          globalCapture(e, "Failed to save AquaMai configuration")
        }
      }
    })


    return () => <NModal
      preset="card"
      class="w-[min(90vw,100em)]"
      title="Mod Management"
      v-model:show={show.value}
    >
      {!!modInfo.value && <NFlex vertical>
        <NFlex align="center">
          MelonLoader:
          {modInfo.value.melonLoaderInstalled ? <span class="c-green-6">Installed</span> : <span class="c-red-6">Not installed</span>}
          {!modInfo.value.melonLoaderInstalled && <NButton secondary loading={installingMelonLoader.value} onClick={installMelonLoader}>Install</NButton>}
          <div class="w-8"/>
          AquaMai:
          {modInfo.value.aquaMaiInstalled ?
            !shouldShowUpdate.value ? <span class="c-green-6">Installed</span> : <span class="c-orange">Updatable</span> :
            <span class="c-red-6">Not installed</span>}
          <NButton secondary loading={installingAquaMai.value} onClick={() => installAquaMai()}
                   type={showAquaMaiInstallDone.value ? 'success' : 'default'}>
            {showAquaMaiInstallDone.value ? <span class="i-material-symbols-done"/> : modInfo.value.aquaMaiInstalled ? 'Reinstall / Update' : 'Install'}
          </NButton>
          Installed:
          <span>{modInfo.value.aquaMaiVersion}</span>
          Installable:
          <span class={shouldShowUpdate.value ? "c-orange" : ""}>{modInfo.value.bundledAquaMaiVersion}</span>
          <NSwitch v-model:value={useNewSort.value} class="m-l"/>
          Use new sorting method
        </NFlex>
        {props.badgeType && <NCheckbox v-model:checked={disableBadge.value}>Hide the badge on the button</NCheckbox>}
        {configReadErr.value ? <NFlex vertical justify="center" align="center" class="min-h-100">
          <div class="text-8">AquaMai is not installed or needs to be updated</div>
          <div class="c-gray-5 text-lg">{configReadErr.value}</div>
          <div class="c-gray-4 text-sm">{configReadErrTitle.value}</div>
        </NFlex> : <AquaMaiConfigurator config={config.value!} useNewSort={useNewSort.value}/>}
      </NFlex>}
    </NModal>;
  }
})
