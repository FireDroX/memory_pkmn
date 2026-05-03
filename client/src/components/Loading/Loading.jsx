import "./Loading.css";
import { Suspense } from "react";

export const Loading = () => (
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
    <h5>The room is loading or does not exists !</h5>
  </div>
);

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
