import { computed, defineComponent, ref, watch } from "vue";
import { NButton, NFlex, NFormItem, NInput, NModal, useMessage } from "naive-ui";
import { error, errorContext, errorId } from "@/store/refs";
import { captureFeedback } from "@sentry/vue";

export default defineComponent({
  setup(props) {
    const nMessage = useMessage();

    const message = computed(() => {
      let msg: string;
      if (!error.value) return "";
      if (error.value.error) {
        msg = error.value.error.message || error.value.error.toString();
      } else if (error.value.message) {
        msg = error.value.message;
      } else {
        msg = error.value.toString();
      }
      msg = msg.split('\n')[0]
      return msg
    })

    const userInput = ref("");

    watch(() => error.value, (v, old) => {
      // Prevent clearing the input if a new error occurs mid-typing
      if (old) return;
      userInput.value = "";
    });

    const report = () => {
      captureFeedback({
        associatedEventId: errorId.value,
        message: userInput.value || "None",
      })
      nMessage.success("Thank you for your feedback!");
      error.value = null;
    }

    return () => <NModal
      preset="card"
      class="w-[min(50vw,60em)]"
      title="An error occurred!"
      show={!!error.value}
      onUpdateShow={() => (error.value = null)}
    >
      {{
        default: () => (<NFlex vertical size="large">
          <div class="text-lg">{errorContext.value}</div>
          {message.value}
          <NInput v-model:value={userInput.value} class="w-full" type="textarea" placeholder="Could you please provide some relevant background or context? For example, does your game or music have any special characteristics?"/>
        </NFlex>
        footer: () => <NFlex justify="end">
          <NButton onClick={report}>Send Feedback</NButton>
        </NFlex>
      }}
    </NModal>;
  }
})
