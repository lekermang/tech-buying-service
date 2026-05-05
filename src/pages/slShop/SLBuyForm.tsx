import SLBuyFormItemSection from "./SLBuyFormItemSection";
import SLBuyFormClientSection from "./SLBuyFormClientSection";
import SLBuyFormPricesAndPlace from "./SLBuyFormPricesAndPlace";
import { SLPageWrap } from "./slUI";
import { useSLBuyFormState } from "./buyForm/useSLBuyFormState";
import { useSLBuyFormActions } from "./buyForm/useSLBuyFormActions";
import SLBuyFormHeader from "./buyForm/SLBuyFormHeader";
import SLBuyFormFooter from "./buyForm/SLBuyFormFooter";

export default function SLBuyForm({ token, onSaved }: { token: string; onSaved: () => void }) {
  const st = useSLBuyFormState();
  const { generateSpecsAI, submit } = useSLBuyFormActions(token, st);

  return (
    <SLPageWrap max="md">
      <div className="space-y-2">
        <SLBuyFormHeader st={st} />

        <SLBuyFormItemSection
          cats={st.cats}
          categoryId={st.categoryId} setCategoryId={st.setCategoryId}
          title={st.title} setTitle={st.setTitle}
          model={st.model} setModel={st.setModel}
          brand={st.brand} setBrand={st.setBrand}
          specsShort={st.specsShort} setSpecsShort={st.setSpecsShort}
          specs={st.specs} setSpecs={st.setSpecs}
          ramGb={st.ramGb} setRamGb={st.setRamGb}
          storageGb={st.storageGb} setStorageGb={st.setStorageGb}
          color={st.color} setColor={st.setColor}
          battery={st.battery} setBattery={st.setBattery}
          condition={st.condition} setCondition={st.setCondition}
          imei={st.imei} setImei={st.setImei}
          serial={st.serial} setSerial={st.setSerial}
          hasBox={st.hasBox} setHasBox={st.setHasBox}
          hasCharger={st.hasCharger} setHasCharger={st.setHasCharger}
          autofilled={st.autofilled}
          isPhoneCategory={st.isPhoneCategory}
          isAppleDevice={st.isAppleDevice}
          aiBusy={st.aiBusy} aiMsg={st.aiMsg}
          generateSpecsAI={generateSpecsAI}
        />

        <SLBuyFormClientSection
          token={token}
          clientQuery={st.clientQuery} setClientQuery={st.setClientQuery}
          clientId={st.clientId} setClientId={st.setClientId}
          clientResults={st.clientResults}
          showClientDrop={st.showClientDrop} setShowClientDrop={st.setShowClientDrop}
          showQuickClient={st.showQuickClient} setShowQuickClient={st.setShowQuickClient}
        />

        <SLBuyFormPricesAndPlace
          source={st.source}
          buyPrice={st.buyPrice} setBuyPrice={st.setBuyPrice}
          sellPrice={st.sellPrice} setSellPrice={st.setSellPrice}
          minPrice={st.minPrice} setMinPrice={st.setMinPrice}
          consignmentPercent={st.consignmentPercent} setConsignmentPercent={st.setConsignmentPercent}
          status={st.status} setStatus={st.setStatus}
        />

        <SLBuyFormFooter st={st} submit={submit} token={token} onSaved={onSaved} />
      </div>
    </SLPageWrap>
  );
}
