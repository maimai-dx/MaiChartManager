import { computed, defineComponent, PropType } from "vue";
import { NButton, NFlex, NInputGroup, NInputGroupLabel, NInputNumber, NPopover } from "naive-ui";
import { selectedADir, version } from "@/store/refs";

// This is the version, not addVersion. It's the version that everyone likes to write as 22001
export default defineComponent({
  props: {
    value: Number
  },
  setup(props, {emit}) {
    const value = computed({
      get: () => props.value || 0,
      set: (v) => emit('update:value', v)
    })
    const b15val = computed(() => 20000 + (version.value?.gameVersion || 45) * 100);

    return () => <NInputGroup>
      <NInputNumber showButton={false} class="w-full" v-model:value={value.value} min={0}/>
      {!!version.value?.gameVersion && <>
        {/* Only display after successfully detecting the game version */}
        {/* There is a problem with the button border z-index */}
        <NButton class={value.value < b15val.value ? "z-1" : ""} type={value.value < b15val.value ? 'success' : 'default'} ghost
                 disabled={selectedADir.value === 'A000'} onClick={() => (value.value = 20000)}>Include in B35</NButton>
        <NButton class={value.value >= b15val.value ? "z-1" : ""} type={value.value >= b15val.value ? 'success' : 'default'} ghost
                 disabled={selectedADir.value === 'A000'} onClick={() => (value.value = 20000 + version.value!.gameVersion! * 100)}>Include in B15</NButton>
      </>}
      <NPopover trigger="hover">
        {{
          trigger: () => <NInputGroupLabel>
            ?
          </NInputGroupLabel>,
          default: () => <div>
            If the game version is
            <span class="c-orange"> 1.{version.value?.gameVersion || 45} </span>
            , then if the number here is greater than or equal to
            <span class="c-orange"> 2{version.value?.gameVersion || 45}00 </span>
            the tracks will appear in B15; otherwise, they will appear in B35.
          </div>
        }}
      </NPopover>
    </NInputGroup>;
  }
})
