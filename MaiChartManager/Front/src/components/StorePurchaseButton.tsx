import { defineComponent } from "vue";
import { NButton, useDialog } from "naive-ui";
import api from "@/client/api";

export default defineComponent({
  setup(props) {
    const dialog = useDialog();

    const onClick = () => {
      if (location.hostname !== 'mcm.invalid') {
        dialog.info({
          title: 'Notice',
          content: 'You need to make the purchase on a device running the server side',
          positiveText: 'Continue',
          negativeText: 'Cancel',
          onPositiveClick: () => {
            api.RequestPurchase()
          }
        });
      } else {
        api.RequestPurchase()
      }
    }

    return () => <NButton secondary onClick={onClick}>
      <span class="i-fluent-store-microsoft-16-filled text-lg mr-2"/>
      Microsoft Store
    </NButton>;
  }
})
