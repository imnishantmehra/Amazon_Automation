import "./LoaderStyle.css";

const Loader = () => {
  return (
    <span style={{ display: "inline-flex" }}>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </span>
  );
};

export default Loader;
