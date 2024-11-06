import "./Loading.css";

const Loading = () => {
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
      <h5>The room is loading or does not exists !</h5>
    </div>
  );
};

export default Loading;
