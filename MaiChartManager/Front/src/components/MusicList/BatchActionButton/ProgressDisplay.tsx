import { defineComponent, ref } from "vue";
import { NFlex, NProgress } from "naive-ui";

export const progressCurrent = ref(0);
export const progressAll = ref(100);
export const currentProcessItem = ref('');

export default defineComponent({
  setup(props) {
    return () => <NFlex vertical>
      <div>Current Progress: {progressCurrent.value}/{progressAll.value}</div>
      <div>Current Task: {currentProcessItem.value}</div>
      <NProgress
        type="line"
        status="success"
        percentage={Math.floor(progressCurrent.value / progressAll.value * 100)}
        indicator-placement="inside"
        processing
      />
    </NFlex>;
  }
})
