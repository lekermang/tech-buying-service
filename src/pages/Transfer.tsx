import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type Role, TopBar, RoleScreen } from "./transfer/shared";
import SenderFlow from "./transfer/SenderFlow";
import ReceiverFlow from "./transfer/ReceiverFlow";
import PcFlow from "./transfer/PcFlow";
import TransferSEO from "./transfer/TransferSEO";
import TransferFAQ from "./transfer/TransferFAQ";

export default function Transfer() {
  const [params] = useSearchParams();
  const joinFromUrl = params.get("join");
  const codeFromUrl = params.get("code");

  const [role, setRole] = useState<Role>("select");

  useEffect(() => {
    if (joinFromUrl || codeFromUrl) setRole("receiver");
  }, [joinFromUrl, codeFromUrl]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TransferSEO />
      <TopBar />
      {role === "select" && (
        <>
          <RoleScreen onSelect={setRole} />
          <TransferFAQ />
        </>
      )}
      {role === "sender" && <SenderFlow onCancel={() => setRole("select")} />}
      {role === "pc" && <PcFlow onCancel={() => setRole("select")} />}
      {role === "receiver" && (
        <ReceiverFlow
          prefillCode={codeFromUrl || joinFromUrl || ""}
          onCancel={() => setRole("select")}
        />
      )}
    </div>
  );
}
