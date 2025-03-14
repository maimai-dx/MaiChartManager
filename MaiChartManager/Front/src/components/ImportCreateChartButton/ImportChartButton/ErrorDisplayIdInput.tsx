import { computed, defineComponent, effect, PropType, watch } from "vue";
import { NAlert, NButton, NCheckbox, NCollapse, NCollapseItem, NFlex, NForm, NFormItem, NInputNumber, NModal, NPopover, NRadio, NRadioButton, NRadioGroup, NScrollbar, NSelect, SelectOption } from "naive-ui";
import { ImportChartMessage, MessageLevel, ShiftMethod } from "@/client/apiGen";
import { ImportChartMessageEx, ImportMeta, MOVIE_CODEC, SavedOptions, TempOptions } from "./types";
import noJacket from '@/assets/noJacket.webp';
import { addVersionList, genreList, showNeedPurchaseDialog } from "@/store/refs";
import GenreInput from "@/components/GenreInput";
import VersionInput from "@/components/VersionInput";
import { UTAGE_GENRE } from "@/consts";
import MusicIdConflictNotifier from "@/components/MusicIdConflictNotifier";

export default defineComponent({
  props: {
    show: {type: Boolean, required: true},
    meta: {type: Array as PropType<ImportMeta[]>, required: true},
    tempOptions: {type: Object as PropType<TempOptions>, required: true},
    savedOptions: {type: Object as PropType<SavedOptions>, required: true},
    closeModal: {type: Function, required: true},
    proceed: {type: Function as PropType<() => any>, required: true},
    errors: {type: Array as PropType<ImportChartMessageEx[]>, required: true}
  },
  setup(props, {emit}) {
    const show = computed({
      get: () => props.show,
      set: (val) => props.closeModal()
    })

    watch([() => props.savedOptions.genreId, () => show.value], ([val]) => {
      for (const meta of props.meta) {
        meta.id = meta.id % 1e5 + (val === UTAGE_GENRE ? 1e5 : 0);
      }
    })

    return () => <NModal
      preset="card"
      class="w-[min(50vw,50em)]"
      title="Import Prompt"
      v-model:show={show.value}
    >{{
      default: () => <NFlex vertical size="large">
        <NScrollbar class="max-h-24vh">
          <NFlex vertical>
            {
              props.errors.map((error, i) => {
                if ('first' in error) {
                  if (error.padding > 0 && props.tempOptions.shift === ShiftMethod.Legacy) {
                    return <NAlert key={i} type="info" title={error.name}>Will add {error.padding.toFixed(3)} seconds of silence at the beginning of the audio so that the first note is in the second measure</NAlert>
                  }
                  if (error.padding < 0 && props.tempOptions.shift === ShiftMethod.Legacy) {
                    return <NAlert key={i} type="info" title={error.name}>Will trim {(-error.padding).toFixed(3)} seconds of audio so that the first note is in the second measure</NAlert>
                  }
                  if (error.first > 0 && props.tempOptions.shift === ShiftMethod.NoShift) {
                    return <NAlert key={i} type="info" title={error.name}>Will trim {error.first.toFixed(3)} seconds of audio to match the &first value</NAlert>
                  }
                  if (error.first < 0 && props.tempOptions.shift === ShiftMethod.NoShift) {
                    return <NAlert key={i} type="info" title={error.name}>Will add {(-error.first).toFixed(3)} seconds of silence at the beginning of the audio to match the &first value</NAlert>
                  }
                  return <></>
                }
                let type: "default" | "info" | "success" | "warning" | "error" = "default";
                switch (error.level) {
                  case MessageLevel.Info:
                    type = 'info';
                    break;
                  case MessageLevel.Warning:
                    type = 'warning';
                    break;
                  case MessageLevel.Fatal:
                    type = 'error';
                    break;
                }
                return <NAlert key={i} type={type} title={error.name} class={`${error.isPaid && 'cursor-pointer'}`}
                  // @ts-ignore
                               onClick={() => error.isPaid && (showNeedPurchaseDialog.value = true)}
                >{error.message}</NAlert>
              })
            }
          </NFlex>
        </NScrollbar>
        {!!props.meta.length && <>
            Assign an ID for the newly imported song(s)
            <NScrollbar class="max-h-24vh">
                <NFlex vertical size="large">
                  {props.meta.map((meta, i) => <MusicIdInput key={i} meta={meta} utage={props.savedOptions.genreId === UTAGE_GENRE}/>)}
                </NFlex>
            </NScrollbar>
            <NFormItem label="Genre" labelPlacement="left" labelWidth="5em" showFeedback={false}>
                <GenreInput options={genreList.value} v-model:value={props.savedOptions.genreId}/>
            </NFormItem>
            <NFormItem label="Version Category" labelPlacement="left" labelWidth="5em" showFeedback={false}>
                <GenreInput options={addVersionList.value} v-model:value={props.savedOptions.addVersionId}/>
            </NFormItem>
            <NFormItem label="Version" labelPlacement="left" labelWidth="5em" showFeedback={false}>
                <VersionInput v-model:value={props.savedOptions.version}/>
            </NFormItem>
            <NCheckbox v-model:checked={props.savedOptions.ignoreLevel}>
                Ignore constant value, do not participate in B50 calculation
            </NCheckbox>
            <NCheckbox v-model:checked={props.savedOptions.disableBga}>
                Do not import BGA even if present
            </NCheckbox>
            <NCollapse>
                <NCollapseItem title="Advanced Options">
                    <NFlex vertical>
                        <NFormItem label="Delay Adjustment Mode" labelPlacement="left" showFeedback={false}>
                            <NFlex vertical class="w-full">
                                <NFlex class="h-34px" align="center">
                                    <NRadioGroup v-model:value={props.tempOptions.shift}>
                                        <NPopover trigger="hover">
                                          {{
                                            trigger: () => <NRadio value={ShiftMethod.Bar} label="By Measure"/>,
                                            default: () => <div>
                                              If the rest at the start of the chart is shorter than one measure, then one measure of silence will be added at the beginning.<br/>
                                              This is suitable for most charts, helping avoid odd initial note timing or issues caused by shifting the chart.<br/>
                                              The first note will appear within the second measure.
                                            </div>
                                          }}
                                        </NPopover>
                                        <NPopover trigger="hover">
                                          {{
                                            trigger: () => <NRadio value={ShiftMethod.Legacy} label="Legacy"/>,
                                            default: () => <div>
                                              Align the chart's first note with the first beat of the second measure.<br/>
                                              This was the default method in versions up to v1.1.1.<br/>
                                              May cause issues if the chart is shifted by non-integer amounts, for example with BPM changes.
                                            </div>
                                          }}
                                        </NPopover>
                                        <NPopover trigger="hover">
                                          {{
                                            trigger: () => <NRadio value={ShiftMethod.NoShift} label="No Shift"/>,
                                            default: () => <div>
                                              Do not modify the chart at all; remove the length specified by &first from the audio (if present).<br/>
                                              This may cause the first note timing to be odd, for example a note might appear immediately at the start.
                                            </div>
                                          }}
                                        </NPopover>
                                    </NRadioGroup>
                                </NFlex>
                            </NFlex>
                        </NFormItem>
                        <NCheckbox v-model:checked={props.savedOptions.noScale}>
                            Do not scale the BGA to a width of 1080. This option will be saved
                        </NCheckbox>
                        <NFormItem label="PV Encoding" labelPlacement="left" showFeedback={false}>
                            <NFlex vertical class="w-full">
                                <NFlex class="h-34px" align="center">
                                    <NSelect v-model:value={props.savedOptions.movieCodec} options={[
                                      {label: 'Prefer H264', value: MOVIE_CODEC.PreferH264},
                                      {label: 'Force H264', value: MOVIE_CODEC.ForceH264},
                                      {label: 'Force VP9 USM', value: MOVIE_CODEC.ForceVP9},
                                    ]}/>
                                </NFlex>
                            </NFlex>
                        </NFormItem>
                    </NFlex>
                </NCollapseItem>
            </NCollapse>
        </>}
      </NFlex>,
      footer: () => <NFlex justify="end">
        <NButton onClick={() => show.value = false}>{props.meta.length ? 'Cancel' : 'Close'}</NButton>
        {!!props.meta.length && <NButton onClick={props.proceed}>Continue</NButton>}
      </NFlex>
    }}</NModal>;
  }
})

const MusicIdInput = defineComponent({
  props: {
    meta: {type: Object as PropType<ImportMeta>, required: true},
    utage: {type: Boolean, required: true},
  },
  setup(props) {
    const dxBase = computed(() => {
      const dx = props.meta.isDx ? 1e4 : 0
      const utage = props.utage ? 1e5 : 0
      return dx + utage;
    });
    const img = computed(() => props.meta.bg ? URL.createObjectURL(props.meta.bg) : noJacket);

    return () => <NFlex align="center" size="large">
      <img src={img.value} class="h-16 w-16 object-fill shrink-0"/>
      <div class="w-0 grow">{props.meta.name}</div>
      <MusicIdConflictNotifier id={props.meta.id}/>
      <NInputNumber v-model:value={props.meta.id} min={dxBase.value + 1} max={dxBase.value + 1e4 - 1} step={1} class="shrink-0"/>
    </NFlex>
  }
})
