import { defineComponent } from 'vue';
import { dateEnUS, NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider, enUS } from 'naive-ui';
import FeedbackErrorDialog from "@/components/FeedbackErrorDialog";
import NeedPurchaseDialog from "@/components/NeedPurchaseDialog";
import Index from "@/views/Index";

export default defineComponent({
  render() {
    return (
      <NConfigProvider locale={enUS} dateLocale={dateEnUS}>
        <NNotificationProvider>
          <NDialogProvider>
            <NMessageProvider>
              <Index/>
              <FeedbackErrorDialog/>
              <NeedPurchaseDialog/>
            </NMessageProvider>
          </NDialogProvider>
        </NNotificationProvider>
      </NConfigProvider>
    );
  },
});
