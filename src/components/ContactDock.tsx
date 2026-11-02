"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * EmailJS REST API uses only public identifiers and needs no installed SDK.
 * The service's recipient is configured in the EmailJS dashboard/template,
 * never supplied by a visitor. Do not place private keys in NEXT_PUBLIC_ vars.
 */
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "";
const emailConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY,
);

type Submission = "idle" | "sending" | "sent" | "error";
type ContactFields = { from_name: string; from_email: string; subject: string; message: string };
const INITIAL_FIELDS: ContactFields = { from_name: "", from_email: "", subject: "", message: "" };

function isValidContact(fields: ContactFields) {
  const name = fields.from_name.trim();
  const email = fields.from_email.trim();
  const subject = fields.subject.trim();
  const message = fields.message.trim();
  // Match the form's native constraints, and additionally reject whitespace-only
  // input. The email pattern is an intentionally conservative client-side check.
  return name.length >= 2 && name.length <= 120 &&
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    subject.length >= 3 && subject.length <= 160 &&
    message.length >= 10 && message.length <= 3000;
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="5.5" width="17.6" height="13" rx="3.2" stroke="currentColor" strokeWidth="1.55" />
      <path d="m4.7 7.4 6.15 4.85a1.8 1.8 0 0 0 2.3 0l6.15-4.85" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

export function ContactDock() {
  const [open, setOpen] = useState(false);
  const [triggerLaunching, setTriggerLaunching] = useState(false);
  const [submission, setSubmission] = useState<Submission>("idle");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<ContactFields>(INITIAL_FIELDS);
  // Explicit field-by-field validation keeps the send state observable,
  // even before the owner has configured EmailJS.
  const fieldReady = [
    fields.from_name.trim().length >= 2 && fields.from_name.trim().length <= 120,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.from_email.trim()) && fields.from_email.trim().length <= 254,
    fields.subject.trim().length >= 3 && fields.subject.trim().length <= 160,
    fields.message.trim().length >= 10 && fields.message.trim().length <= 3000,
  ];
  const readyCount = fieldReady.filter(Boolean).length;
  const formValid = isValidContact(fields);
  const formHint = !formValid
    ? `${readyCount} / 4 FIELDS VALID · COMPLETE ALL FIELDS TO SEND`
    : emailConfigured
      ? "READY TO SEND · DELIVERED VIA EMAILJS"
      : "FORM READY · EMAILJS SETUP REQUIRED";
  const canSend = emailConfigured && formValid && submission !== "sending" && submission !== "sent";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const lastSentRef = useRef(0);
  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const launchTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (triggerTimerRef.current !== null) clearTimeout(triggerTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => nameRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  function updateField<K extends keyof ContactFields>(key: K, value: ContactFields[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
    if (submission === "error" || submission === "sent") {
      setSubmission("idle");
      setMessage("");
    }
  }

  function openContact() {
    if (open || triggerLaunching) return;

    const showDialog = () => {
      triggerTimerRef.current = null;
      setTriggerLaunching(false);
      setSubmission("idle");
      setMessage("");
      setOpen(true);
    };

    // Make the tactile press-and-release visible before opening the modal.
    // Respect reduced-motion settings without delaying the form.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showDialog();
      return;
    }
    setTriggerLaunching(true);
    launchTimer.current = window.setTimeout(() => {
      showDialog();
    }, 440);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("website") ?? "").trim()) return; // honeypot
    const fromName = String(data.get("from_name") ?? "").trim();
    const fromEmail = String(data.get("from_email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const text = String(data.get("message") ?? "").trim();
    if (!isValidContact({ from_name: fromName, from_email: fromEmail, subject, message: text }) || !form.checkValidity()) return;

    if (Date.now() - lastSentRef.current < 10_000) {
      setSubmission("error");
      setMessage("Please allow a few seconds before sending another message.");
      return;
    }
    setSubmission("sending");
    setMessage("Sending your message…");
    try {
      const result = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name: fromName,
            from_email: fromEmail,
            reply_to: fromEmail,
            subject,
            message: text,
          },
        }),
      });
      if (!result.ok) throw new Error(`EmailJS returned ${result.status}`);
      lastSentRef.current = Date.now();
      form.reset();
      setFields(INITIAL_FIELDS);
      setSubmission("sent");
      setMessage("Message sent. Thanks for reaching out — I'll be in touch!");
    } catch (error) {
      console.error("Unable to send contact message", error);
      setSubmission("error");
      setMessage("That didn't go through. Please try again in a moment.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`mail-dock-trigger mail-dock-motion${triggerLaunching ? " mail-dock-motion--launch" : ""}${open ? " mail-dock-motion--hidden" : ""}`}
        data-motion-version="v20"
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        onClick={openContact}
        aria-label="Send Keegan a message"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="portfolio-contact-dialog"
        title="Send a message"
      >
        <span className="mail-dock-motion__glow" aria-hidden="true" />
        <span className="mail-dock-motion__ripple" aria-hidden="true" />
        <span className="mail-dock-icon"><EnvelopeIcon /></span>
        <span className="mail-dock-glint" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="mail-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            id="portfolio-contact-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mail-modal-title"
            aria-describedby="mail-modal-description"
            className="mail-modal"
            ref={dialogRef}
          >
            <div className="mail-modal-optic-surface" aria-hidden="true" />
            <div className="mail-modal-inner">
            <div className="mail-modal-topline">
              <span className="mono mail-modal-eyebrow"><span className="mail-modal-signal" /> DIRECT CONNECTION <span className="mail-modal-optics-label">REFRACTIVE / ACTIVE</span></span>
              <button type="button" className="mail-modal-close" onClick={() => setOpen(false)} aria-label="Close contact form">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="mail-modal-heading">
              <span className="mail-modal-emblem"><EnvelopeIcon /></span>
              <div>
                <h2 id="mail-modal-title">Start a conversation.</h2>
                <p id="mail-modal-description">Have a project, an opportunity, or an idea worth exploring? Send me a note.</p>
              </div>
            </div>

            <form className="mail-modal-form" onSubmit={sendMessage}>
              <div className="mail-modal-pair">
                <label>YOUR NAME
                  <input ref={nameRef} name="from_name" type="text" autoComplete="name" placeholder="Jane Smith" minLength={2} maxLength={120} value={fields.from_name} onChange={(event) => updateField("from_name", event.target.value)} required disabled={submission === "sending"} />
                </label>
                <label>EMAIL ADDRESS
                  <input name="from_email" type="email" autoComplete="email" placeholder="jane@company.com" maxLength={254} value={fields.from_email} onChange={(event) => updateField("from_email", event.target.value)} required disabled={submission === "sending"} />
                </label>
              </div>
              <label>SUBJECT
                <input name="subject" type="text" placeholder="Let's work together" minLength={3} maxLength={160} value={fields.subject} onChange={(event) => updateField("subject", event.target.value)} required disabled={submission === "sending"} />
              </label>
              <label>MESSAGE
                <textarea name="message" rows={5} placeholder="Tell me a little about what you have in mind…" minLength={10} maxLength={3000} value={fields.message} onChange={(event) => updateField("message", event.target.value)} required disabled={submission === "sending"} />
              </label>
              <div className="mail-modal-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

              {!emailConfigured && (
                <p className="mail-modal-setup" role="status">
                  EmailJS setup needed: add your public Service ID, Template ID, and Public Key in <code>.env.local</code> to enable sending.
                </p>
              )}

              {message && (
                <p className={`mail-modal-feedback is-${submission}`} role="status" aria-live="polite">{message}</p>
              )}

              <div className="mail-modal-footer">
                <div className="mail-modal-validation" id="mail-modal-validation-hint" aria-live="polite">
                  <span className="mono mail-modal-aside">{formHint}</span>
                  <span className="mail-modal-valid-indicators" aria-hidden="true">
                    {fieldReady.map((ready, index) => <i key={index} className={ready ? "is-valid" : undefined} />)}
                  </span>
                </div>
                <button type="submit" className="mail-modal-submit" disabled={!canSend} aria-describedby={!formValid ? "mail-modal-validation-hint" : undefined}>
                  {submission === "sending" ? "Sending…" : "Send message"}
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 14-7-5 14-2.8-6.2L5 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="m11.2 12.8 7.8-7.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
