import Modal from "./Modal";
export default function ConfirmDialog({open,title="Confirm",message,onCancel,onConfirm}) {
  return <Modal open={open} title={title} onClose={onCancel}>
    <p className="mb-5 text-sm text-slate-600">{message}</p>
    <div className="flex justify-end gap-2">
      <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn-primary" onClick={onConfirm}>Confirm</button>
    </div>
  </Modal>;
}
