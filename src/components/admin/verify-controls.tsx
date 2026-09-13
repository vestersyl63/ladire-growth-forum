"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import {
  adminApprovePayment,
  adminRejectPayment,
  adminMarkUnderReview,
  type AdminActionResult,
} from "@/app/actions/admin-operations-actions";

export function ConfirmApprove({
  paymentId,
  amountKobo,
  quantity,
  nomineeName,
  reference,
  onDone,
}: {
  paymentId: string;
  amountKobo: number;
  quantity: number;
  nomineeName: string;
  reference: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const run = () => {
    start(async () => {
      const res: AdminActionResult = await adminApprovePayment(paymentId);
      if (res.ok) {
        toast.push("success", "Payment approved — votes counted exactly once.");
      } else {
        toast.push("error", res.error || "Approval failed");
      }
      setOpen(false);
      router.refresh();
      onDone?.();
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-success btn-md">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Approve payment
      </button>
      {open ? (
        <ConfirmDialog
          tone="success"
          title="Approve this payment?"
          onCancel={() => setOpen(false)}
          onConfirm={run}
          pending={pending}
        >
          <p>
            You are about to approve payment <b>{reference}</b> (₦
            {(amountKobo / 100).toLocaleString("en-NG")}) and add{" "}
            <b>{quantity} official vote{quantity === 1 ? "" : "s"}</b> to{" "}
            <b>{nomineeName}</b>.
          </p>
          <p className="mt-2 text-xs">
            This action is recorded in the audit log and cannot be undone. Approving twice never
            double-counts votes.
          </p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}

export function RejectForm({ paymentId, onDone }: { paymentId: string; onDone?: () => void }) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const run = () => {
    if (reason.trim().length < 3) {
      toast.push("error", "A rejection reason is required.");
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("reason", reason);
      const res: AdminActionResult = await adminRejectPayment(paymentId, null, fd);
      if (res.ok) toast.push("success", "Payment rejected. No votes were counted.");
      else toast.push("error", res.error || "Rejection failed");
      router.refresh();
      onDone?.();
    });
  };

  return (
    <div className="rounded-xl border border-crimson-200 bg-crimson-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-crimson-900">
        <XCircle className="h-4 w-4" aria-hidden="true" /> Reject this payment
      </p>
      <p className="mt-1 text-xs text-crimson-800">
        Rejection means votes are NOT counted. The reason is shown to the voter.
      </p>
      <label htmlFor={`reject-reason-${paymentId}`} className="lbl mt-3">Rejection reason *</label>
      <textarea
        id={`reject-reason-${paymentId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="field"
        placeholder="e.g. Amount paid does not match the expected amount."
      />
      <button type="button" onClick={run} disabled={pending} className="btn btn-danger btn-md mt-3 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
        Confirm rejection
      </button>
    </div>
  );
}

export function UnderReviewButton({ paymentId }: { paymentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const run = () =>
    start(async () => {
      const res: AdminActionResult = await adminMarkUnderReview(paymentId);
      if (res.ok) toast.push("success", "Moved to under review.");
      else toast.push("error", res.error || "Could not update.");
      router.refresh();
    });
  return (
    <button type="button" onClick={run} disabled={pending} className="btn btn-outline btn-md">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Mark under review
    </button>
  );
}

export function ConfirmDialog({
  title,
  children,
  tone = "danger",
  onCancel,
  onConfirm,
  pending,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "danger" | "success" | "info";
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-pop">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            tone === "success" ? "bg-emerald-100 text-emerald-600" : tone === "info" ? "bg-navy-100 text-navy-600" : "bg-crimson-100 text-crimson-600"
          }`}
        >
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-center font-display text-lg font-extrabold text-navy-950">{title}</h2>
        <div className="mt-3 text-sm text-navy-700">{children}</div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={pending} className="btn btn-outline btn-md">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              tone === "success" ? "btn btn-success btn-md" : tone === "info" ? "btn btn-navy btn-md" : "btn btn-danger btn-md"
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {tone === "success" ? "Yes, approve" : tone === "info" ? "Continue" : "Yes, continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
