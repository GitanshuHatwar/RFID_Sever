export default function Modal({ open, title, onClose, children, wide=false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={onClose}>
      <div className={`max-h-[92vh] overflow-y-auto rounded-xl bg-white shadow-2xl ${wide ? "w-full max-w-4xl" : "w-full max-w-lg"}`}
           onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="text-2xl text-slate-400" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
