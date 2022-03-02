export function AnnotationsInfoMessage({ url, annotations, onClick }) {
  return (
    <div
      className="w-5/6 py-1 px-2 bg-white rounded-lg drop-shadow-lg md:drop-shadow-sm"
      onClick={onClick}
    >
      <div className="text-sm md:text-base">
        Showing {annotations?.length || 0} annotations from Hacker News and
        Hypothes.is.
        <br />{" "}
        <a href={url} className="underline">
          Click here
        </a>{" "}
        to open the original link.
      </div>
    </div>
  );
}

export default AnnotationsInfoMessage;
