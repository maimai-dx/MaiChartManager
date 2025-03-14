import { computed, defineComponent, PropType } from "vue";
import { NButton, NFlex, NInputNumber, NModal, NProgress } from "naive-ui";
import { IMPORT_STEP, ImportMeta } from "./types";

export default defineComponent({
  props: {
    show: {type: Boolean, required: true},
    movieProgress: {type: Number, required: true},
    closeModal: {type: Function, required: true},
    current: {type: Object as PropType<ImportMeta>, required: true},
  },
  setup(props, {emit}) {
    const show = computed({
      get: () => props.show,
      set: (val) => props.closeModal()
    })
    return () => <NModal
      preset="card"
      class="w-[min(40vw,40em)]"
      title="Importing..."
      closable={false}
      maskClosable={false}
      closeOnEsc={false}
      show={show.value}
    >
      <NFlex vertical class="text-4">
        <div>
          <span class="op-90">The project currently being processed:</span>
          {props.current.name}
        </div>
        <Step step={IMPORT_STEP.create} current={props.current.importStep} name="Create Song"/>
        <Step step={IMPORT_STEP.chart} current={props.current.importStep} name="Convert Chart"/>
        <Step step={IMPORT_STEP.music} current={props.current.importStep} name="Transcode Audio"/>
        {props.current.movie && <Step step={IMPORT_STEP.movie} current={props.current.importStep} name="Transcode Video"/>}
        {props.current.movie && !!props.movieProgress && <NProgress
            type="line"
            percentage={props.movieProgress}
            indicator-placement="inside"
            processing
        >
          {props.movieProgress === 100 ? 'Still processing, don\'t worry...' : `${props.movieProgress}%`}
        </NProgress>}
        <Step step={IMPORT_STEP.jacket} current={props.current.importStep} name="Import Cover"/>
      </NFlex>
    </NModal>
  }
})

const Step = defineComponent({
  props: {
    name: String,
    step: {type: Number as PropType<IMPORT_STEP>, required: true},
    current: {type: Number as PropType<IMPORT_STEP>, required: true},
  },
  setup(props) {
    const icon = computed(() => {
      if (props.current < props.step) return 'i-mdi-dots-horizontal'
      if (props.current === props.step) return 'i-mdi-arrow-right-thin'
      return 'i-material-symbols-done'
    })

    const className = computed(() => {
      if (props.current < props.step) return 'text-zinc-400'
      if (props.current === props.step) return 'text-blue-600 font-bold'
      return 'text-green-600'
    })

    return () => <NFlex class={className.value} align="center">
      <div class={icon.value}/>
      {props.name}
      {props.current === props.step && '...'}
    </NFlex>
  }
})
