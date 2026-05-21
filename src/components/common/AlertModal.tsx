import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useAlertStore } from "../../store/useAlertStore";
import "./AlertModal.scss";

export default function AlertModal() {
  const { isOpen, message, type, closeAlert } = useAlertStore();

  if (!isOpen) return null;

  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;

  return (
    <div className="alert-modal-overlay" onClick={closeAlert}>
      <div className={`alert-modal-content ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-icon-wrapper">
          <Icon size={28} />
        </div>
        <div className="alert-message">{message}</div>
        <button className="alert-close-btn" onClick={closeAlert}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
