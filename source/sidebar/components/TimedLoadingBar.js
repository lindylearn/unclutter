import { useState, useEffect } from "react";

export function GeneratingAnnotationsMessage({ onClick }) {
  return (
    <div
      className="w-5/6 py-1 px-2 bg-white rounded-lg drop-shadow-sm"
      onClick={onClick}
    >
      Loading annotations for new page...
      <div className="my-2">
        <TimedLoadingBar seconds={60} />
      </div>
    </div>
  );
}

function TimedLoadingBar({ seconds }) {
  const [progressPercentage, setProgressPercentage] = useState(0);
  useEffect(() => {
    if (progressPercentage < 100) {
      setTimeout(
        () => setProgressPercentage(progressPercentage + 100 / seconds),
        1000
      );
    }
  }, [progressPercentage]);

  return (
    <div className="h-1 w-full bg-gray-300">
      <div
        style={{
          width: `${progressPercentage}%`,
          transition: "width 1s linear",
        }}
        className={`h-full bg-red-400`}
      ></div>
    </div>
  );
}
export default TimedLoadingBar;
