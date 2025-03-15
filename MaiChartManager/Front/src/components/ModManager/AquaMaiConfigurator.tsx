import { defineComponent, PropType, ref, computed } from 'vue';
import { ConfigDto, Entry, IEntryState, ISectionState, Section } from "@/client/apiGen";
import { NAnchor, NAnchorLink, NDivider, NFlex, NForm, NFormItem, NInput, NInputNumber, NScrollbar, NSelect, NSwitch } from "naive-ui";
import { capitalCase } from "change-case";
import comments from "./modComments.yaml";
import _ from "lodash";
import { KeyCodeName } from "@/components/ModManager/types/KeyCodeName";
import ProblemsDisplay from "@/components/ProblemsDisplay";
import configSort from './configSort.yaml'
import { useMagicKeys, whenever } from "@vueuse/core";

const sectionPanelOverrides = import.meta.glob('./sectionPanelOverride/*/index.tsx', { eager: true })
const getSectionPanelOverride = (path: string) => {
  return (sectionPanelOverrides[`./sectionPanelOverride/${path}/index.tsx`] as any)?.default
}

const getNameForPath = (path: string, name: string) => {
  if (comments.nameOverrides[path]) return comments.nameOverrides[path]
  return capitalCase(name)
}

const ConfigEntry = defineComponent({
  props: {
    entry: { type: Object as PropType<Entry>, required: true },
    entryState: { type: Object as PropType<IEntryState>, required: true },
  },
  setup(props, { emit }) {
    return () => <NFormItem label={getNameForPath(props.entry.path!, props.entry.name!)} labelPlacement="left" labelWidth="10em"
      // @ts-ignore
                            title={props.entry.path!}
    >
      <NFlex vertical class="w-full ws-pre-line">
        <NFlex class="h-34px" align="center">
          {(() => {
            const choices = comments.options[props.entry.path!]
            if (choices) {
              return <NSelect v-model:value={props.entryState.value} options={choices} clearable/>
            }
            switch (props.entry.fieldType) {
              case 'System.Boolean':
                return <NSwitch v-model:value={props.entryState.value}/>;
              case 'System.String':
                return <NInput v-model:value={props.entryState.value} placeholder="" onUpdateValue={v => props.entryState.value = typeof v === 'string' ? v : ''}/>;
              case 'System.Int32':
                return <NInputNumber value={props.entryState.value} onUpdateValue={v => props.entryState.value = typeof v === 'number' ? v : 0} placeholder="" precision={0} step={1}/>;
              case 'System.UInt32':
                return <NInputNumber value={props.entryState.value} onUpdateValue={v => props.entryState.value = typeof v === 'number' ? v : 0} placeholder="" precision={0} step={1} min={0}/>;
              case 'System.Byte':
                return <NInputNumber value={props.entryState.value} onUpdateValue={v => props.entryState.value = typeof v === 'number' ? v : 0} placeholder="" precision={0} step={1} min={0} max={255}/>;
              case 'System.Double':
              case 'System.Single':
                return <NInputNumber value={props.entryState.value} onUpdateValue={v => props.entryState.value = typeof v === 'number' ? v : 0} placeholder="" step={.1}/>;
              case 'AquaMai.Config.Types.KeyCodeOrName':
                return <NSelect v-model:value={props.entryState.value} options={Object.entries(KeyCodeName).map(([label, value]) => ({ label, value }))}/>;
            }
            return `Unsupported type: ${props.entry.fieldType}`;
          })()}
          {comments.shouldEnableOptions[props.entry.path!] && !props.entryState.value && <ProblemsDisplay problems={['This option needs to be enabled']}/>}
        </NFlex>
        {comments.commentOverrides[props.entry.path!] || props.entry.attribute?.comment?.commentEn}
      </NFlex>
    </NFormItem>;
  },
});

const ConfigSection = defineComponent({
  props: {
    section: { type: Object as PropType<Section>, required: true },
    entryStates: { type: Object as PropType<Record<string, IEntryState>>, required: true },
    sectionState: { type: Object as PropType<ISectionState>, required: true },
  },
  setup(props, { emit }) {
    const CustomPanel = getSectionPanelOverride(props.section.path!);

    return () => <NFlex vertical class="p-1 border-transparent border-solid border-1px rd hover:border-yellow-5">
      {!props.section.attribute!.alwaysEnabled && <NFormItem label={getNameForPath(props.section.path!, props.section.path!.split('.').pop()!)} labelPlacement="left" labelWidth="10em"
        // @ts-ignore
                                                             title={props.section.path!}
      >
        <NFlex vertical class="w-full ws-pre-line">
          <NFlex class="h-34px" align="center">
            <NSwitch v-model:value={props.sectionState.enabled}/>
            {comments.shouldEnableOptions[props.section.path!] && !props.sectionState.enabled && <ProblemsDisplay problems={['This option needs to be enabled']}/>}
          </NFlex>
          {comments.commentOverrides[props.section.path!] || props.section.attribute?.comment?.commentEn}
        </NFlex>
      </NFormItem>}
      {props.sectionState.enabled && (
        CustomPanel ?
          <CustomPanel entryStates={props.entryStates} sectionState={props.sectionState}/> :
          !!props.section.entries?.length && <NFlex vertical class="p-l-15">
            {props.section.entries?.filter(it => !it.attribute?.hideWhenDefault || (it.attribute?.hideWhenDefault && !props.entryStates[it.path!].isDefault))
              .map((entry) => <ConfigEntry key={entry.path!} entry={entry} entryState={props.entryStates[entry.path!]}/>)}
          </NFlex>
      )}
    </NFlex>;
  },
});

export default defineComponent({
  props: {
    config: { type: Object as PropType<ConfigDto>, required: true },
    useNewSort: { type: Boolean, default: false },
  },
  setup(props, { emit }) {
    const search = ref('');
    const searchRef = ref();

    const { ctrl_f } = useMagicKeys({
      passive: false,
      onEventFired(e) {
        if (e.ctrlKey && e.key === 'f' && e.type === 'keydown')
          e.preventDefault()
      },
    })
    whenever(ctrl_f, () => searchRef.value?.select());

    const filteredSections = computed(() => {
      if (!search.value) return props.config.sections;
      const s = search.value.toLowerCase();
      return props.config.sections?.filter(it =>
        it.path?.toLowerCase().includes(s) ||
        it.attribute?.comment?.commentEn?.toLowerCase().includes(s) ||
        it.attribute?.comment?.commentZh?.toLowerCase().includes(s) ||
        it.entries?.some(entry => entry.name?.toLowerCase().includes(s) || entry.path?.toLowerCase().includes(s) ||
          entry.attribute?.comment?.commentEn?.toLowerCase().includes(s) || entry.attribute?.comment?.commentZh?.toLowerCase().includes(s))
      );
    })

    const bigSections = computed(() => {
      if (props.useNewSort) {
        return Object.keys(configSort).filter(it => filteredSections.value!.some(s => configSort[it].includes(s.path!)));
      }
      return _.uniq(filteredSections.value!.filter(it => !it.attribute?.exampleHidden).map(s => s.path?.split('.')[0]));
    });

    const otherSection = computed(() => {
      if (!props.useNewSort) return [];
      const knownSections = _.flatten(Object.values(configSort) as string[][]);
      return filteredSections.value?.filter(it => !knownSections.includes(it.path!) && !it.attribute!.exampleHidden) || [];
    });

    return () => <div class="grid cols-[14em_auto]">
      <NAnchor type="block" offsetTarget="#scroll">
        {bigSections.value.map((key) => <NAnchorLink key={key} title={key} href={`#${key}`}/>)}
        {otherSection.value.length > 0 && <NAnchorLink key="others" title="Others" href="#others"/>}
      </NAnchor>
      <NScrollbar class="h-75vh p-2 relative"
        // @ts-ignore
                  id="scroll"
      >
        <NInput v-model:value={search.value} placeholder="Search" size="small" clearable class="sticky top-0 z-200" ref={searchRef}/>
        {bigSections.value.map((big) => <div id={big} key={big}>
          <NDivider titlePlacement="left" class="mt-2!">{big}</NDivider>
          {filteredSections.value?.filter(it => {
            if (props.useNewSort) {
              return configSort[big!].includes(it.path!);
            }
            return it.path!.split('.')[0] === big && !it.attribute!.exampleHidden;
          }).sort((a, b) => {
            if (!props.useNewSort) return 0;
            return configSort[big!].indexOf(a.path!) - configSort[big!].indexOf(b.path!);
          }).map((section) => {
            return <ConfigSection key={section.path!} section={section}
                                  entryStates={props.config.entryStates!}
                                  sectionState={props.config.sectionStates![section.path!]}/>;
          })}
        </div>)}
        {otherSection.value.length > 0 &&
          <div id="others">
            <NDivider titlePlacement="left" class="mt-2!">Others</NDivider>
            {otherSection.value.map((section) =>
              <ConfigSection key="others" section={section}
                             entryStates={props.config.entryStates!}
                             sectionState={props.config.sectionStates![section.path!]}/>)}
          </div>}
      </NScrollbar>
    </div>;
  },
});
