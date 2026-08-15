import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateStatus } from "../../utils/serverStatus";
import "./StatusPopup.css";

const statusDisplayDuration = 2000;

export const useStatusPopup = () => {
  const [notification, setNotification] = useState({ id: 0, status: "" });

  const setStatus = useCallback((status) => {
    setNotification((current) => ({ id: current.id + 1, status }));
  }, []);

  const clearStatus = useCallback(() => {
    setNotification((current) => ({ ...current, status: "" }));
  }, []);

  return {
    status: notification.status,
    statusId: notification.id,
    setStatus,
    clearStatus,
  };
};

const StatusPopup = ({ status, statusId, clearStatus }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!status) return undefined;

    const timeout = window.setTimeout(
      () => clearStatus(""),
      statusDisplayDuration,
    );
    return () => window.clearTimeout(timeout);
  }, [status, statusId, clearStatus]);

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
