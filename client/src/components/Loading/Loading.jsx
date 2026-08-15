import "./Loading.css";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

export const Loading = () => {
  const { t } = useTranslation();
  return (
    <div className="loading-div">
      <div>
        <div className="spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      <h5>{t("loading.room")}</h5>
    </div>
  );
};

const Loader = () => (
  <section id="Loader">
    <div className="loader-spinner-container">
      <div className="loader-spinner" />
    </div>
  </section>
);

export function Loadable(Component, props = {}) {
  return (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );
}
