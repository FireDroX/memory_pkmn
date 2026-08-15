import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  statusDisplayDuration,
  translateStatus,
} from "../../utils/serverStatus";
import "./StatusPopup.css";

const StatusPopup = ({ status, clearStatus }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!status) return undefined;

    const timeout = window.setTimeout(
      () => clearStatus(""),
      statusDisplayDuration,
    );
    return () => window.clearTimeout(timeout);
  }, [status, clearStatus]);

  if (!status) return null;

  return (
    <div className="status-popup-layer">
      <p className="status-popup" role="status" aria-live="polite">
        {translateStatus(status, t)}
      </p>
    </div>
  );
};

export default StatusPopup;
