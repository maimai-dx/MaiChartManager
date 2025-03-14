import { defineComponent, ref } from "vue";
import { NButton } from "naive-ui";
import { globalCapture, updateAll } from "@/store/refs";
import api from "@/client/api";

export default defineComponent({
  setup(props) {
    const load = ref(false);

    const reload = async () => {
      load.value = true;
      try {
        await api.ReloadAll();
        await updateAll();
      } catch (err) {
        globalCapture(err, "Refresh failed");
      } finally {
        load.value = false;
      }
    }

    return () => <NButton secondary loading={load.value} onClick={reload}>
      {!load.value && <span class="i-ic-baseline-refresh text-lg"/>}
    </NButton>;
  }
})
