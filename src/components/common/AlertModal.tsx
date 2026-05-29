import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { useAlertStore } from "../../store/useAlertStore";
import "./AlertModal.scss";

export default function AlertModal() {
  const { isOpen, message, type, closeAlert } = useAlertStore();
  const { isConfirmOpen, confirmMessage, closeConfirm, executeConfirm } = useAlertStore();

  return (
    <>
      {/* 기존 알림 토스트 모달 */}
      {isOpen && (
        <div className="alert-modal-overlay" onClick={closeAlert}>
          <div className={`alert-modal-content ${type}`} onClick={(e) => e.stopPropagation()}>
            <div className="alert-icon-wrapper">
              {type === "success" ? <CheckCircle2 size={28} /> : type === "error" ? <AlertCircle size={28} /> : <Info size={28} />}
            </div>
            <div className="alert-message">{message}</div>
            <button className="alert-close-btn" onClick={closeAlert}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 확인/취소 컨펌 모달 */}
      {isConfirmOpen && (
        <div className="confirm-modal-overlay" onClick={closeConfirm}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>
            <div className="confirm-message">{confirmMessage}</div>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={closeConfirm}>
                취소
              </button>
              <button className="confirm-ok-btn" onClick={executeConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
