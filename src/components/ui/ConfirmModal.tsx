"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open backdrop-blur-sm z-50">
      <div className="modal-box max-w-sm shadow-xl border border-base-200 p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}
          >
            <AlertTriangle size={24} />
          </div>

          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-base-content/70 mt-1">{message}</p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`btn flex-1 ${isDanger ? "btn-error" : "btn-primary"}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
