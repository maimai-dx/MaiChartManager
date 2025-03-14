import { defineComponent } from "vue";
import { NButton, NFlex, NModal, NPopover, NQrCode } from "naive-ui";
import { showNeedPurchaseDialog } from "@/store/refs";
import StorePurchaseButton from "@/components/StorePurchaseButton";
import AfdianIcon from "@/icons/afdian.svg";

export default defineComponent({
  setup(props) {
    return () => <NModal
      preset="card"
      class="w-[min(50vw,60em)]"
      title="Sponsor Version Features"
      v-model:show={showNeedPurchaseDialog.value}
    >
      <NFlex vertical>
        <div>
          This feature is part of the sponsor version; sponsor version users can use it permanently
        </div>
        <div>
          The currently released sponsor version features include:
        </div>
        <ul>
          <li>Convert PV</li>
          <li>Set the audio preview segment</li>
          <li>Modify the song ID</li>
          <li>Batch export songs as new Opt</li>
          <li>Batch convert songs to Maidata</li>
        </ul>
        <div>More features are coming soon</div>
        <NFlex align="center">
          Sponsor to help development and gain access to more features
          <StorePurchaseButton/>
          <NButton secondary onClick={() => window.open("https://afdian.com/item/90b4d1fe70e211efab3052540025c377")}>
              <span class="text-lg c-#946ce6 mr-2 translate-y-.25">
                <AfdianIcon/>
              </span>
            Afdian
          </NButton>
          <NPopover trigger="click">
            {{
              trigger: () => <NButton secondary>
                <span class="text-lg i-ri-qq-fill c-gray-6 mr-1 translate-y-.12">
                  <AfdianIcon/>
                </span>
                QQ Group
              </NButton>,
              default: () => <div><NQrCode value="https://qm.qq.com/q/xA4HgfhIM8"/></div>
            }}
          </NPopover>
        </NFlex>
      </NFlex>
    </NModal>;
  }
})
