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

type Submission = "idle" | "sending" | "sent" | "launching" | "error";
type ContactFields = { name: string; user_email: string; message: string };
const INITIAL_FIELDS: ContactFields = { name: "", user_email: "", message: "" };

function isValidContact(fields: ContactFields) {
  const name = fields.name.trim();
  const email = fields.user_email.trim();
  const message = fields.message.trim();
  // Match the form's native constraints, and additionally reject whitespace-only
  // input. The email pattern is an intentionally conservative client-side check.
  return name.length >= 2 && name.length <= 120 &&
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
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
  const [closing, setClosing] = useState(false);
  const [triggerLaunching, setTriggerLaunching] = useState(false);
  const [triggerHiding, setTriggerHiding] = useState(false);
  const [triggerEntering, setTriggerEntering] = useState(true);
  const [triggerHoverSuppressed, setTriggerHoverSuppressed] = useState(false);
  const [submission, setSubmission] = useState<Submission>("idle");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<ContactFields>(INITIAL_FIELDS);
  // Explicit field-by-field validation keeps the send state observable,
  // even before the owner has configured EmailJS.
  const fieldReady = [
    fields.name.trim().length >= 2 && fields.name.trim().length <= 120,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.user_email.trim()) && fields.user_email.trim().length <= 254,
    fields.message.trim().length >= 10 && fields.message.trim().length <= 3000,
  ];
  const readyCount = fieldReady.filter(Boolean).length;
  const formValid = isValidContact(fields);
  const formHint = !formValid
    ? `${readyCount} / 3 FIELDS VALID · COMPLETE ALL FIELDS TO SEND`
    : emailConfigured
      ? "READY TO SEND · DELIVERED VIA EMAILJS"
      : "FORM READY · EMAILJS SETUP REQUIRED";
  const canSend = emailConfigured && formValid && submission !== "sending" && submission !== "sent";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerHoverSuppressedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const lastSentRef = useRef(0);
  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (triggerTimerRef.current !== null) clearTimeout(triggerTimerRef.current);
  }, []);

  useEffect(() => {
    if (!triggerHoverSuppressed) return;

    function reenableHoverAfterPointerLeaves(event: PointerEvent) {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const pointerInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (!pointerInside) {
        triggerHoverSuppressedRef.current = false;
        setTriggerHoverSuppressed(false);
      }
    }

    window.addEventListener("pointermove", reenableHoverAfterPointerLeaves);
    return () => window.removeEventListener("pointermove", reenableHoverAfterPointerLeaves);
  }, [triggerHoverSuppressed]);

  useEffect(() => {
    if (submission !== "sent" && submission !== "launching") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = submission === "sent"
      ? 900
      : reduceMotion ? 180 : 4200;
    const timer = window.setTimeout(() => {
      if (submission === "sent" && !reduceMotion) setSubmission("launching");
      else setOpen(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [submission]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => nameRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setOpen(false);
        else setClosing(true);
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

  function closeContact() {
    if (!open || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    setClosing(true);
  }

  function updateField<K extends keyof ContactFields>(key: K, value: ContactFields[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
    if (submission === "error" || submission === "sent") {
      setSubmission("idle");
      setMessage("");
    }
  }

  function openContact() {
    if (open || triggerLaunching || triggerHiding) return;

    triggerHoverSuppressedRef.current = true;
    setTriggerHoverSuppressed(true);
    setSubmission("idle");
    setMessage("");
    setOpen(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setTriggerEntering(false);
    setTriggerLaunching(true);
    triggerTimerRef.current = setTimeout(() => {
      triggerTimerRef.current = null;
      setTriggerLaunching(false);
      setTriggerHiding(true);
    }, 600);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("website") ?? "").trim()) return; // honeypot
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("user_email") ?? "").trim();
    const text = String(data.get("message") ?? "").trim();
    if (!isValidContact({ name, user_email: email, message: text }) || !form.checkValidity()) return;

    if (Date.now() - lastSentRef.current < 10_000) {
      setSubmission("error");
      setMessage("Please allow a few seconds before sending another message.");
      return;
    }
    setSubmission("sending");
    setMessage("");
    try {
      const result = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            user_name: name,
            name,
            user_email: email,
            reply_to: email,
            message: text,
            time: new Date().toLocaleString(),
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
        className={`mail-dock-trigger mail-dock-motion${triggerEntering ? " mail-dock-motion--entering" : ""}${triggerLaunching ? " mail-dock-motion--launch" : ""}${triggerHoverSuppressed ? " mail-dock-motion--hover-suppressed" : ""}${triggerHiding ? " mail-dock-motion--exiting" : ""}${open && !triggerLaunching && !triggerHiding ? " mail-dock-motion--hidden" : ""}`}
        data-motion-version="v20"
        onAnimationEnd={(event) => {
          if (event.animationName === "mail-v20-enter") setTriggerEntering(false);
          if (event.animationName === "mail-v20-exit") setTriggerHiding(false);
        }}
        aria-hidden={open || triggerHiding}
        tabIndex={open || triggerHiding ? -1 : 0}
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
          data-submission={submission}
          onMouseDown={(event) => {
            if (submission !== "sending" && submission !== "launching" && event.target === event.currentTarget) closeContact();
          }}
        >
          <div
            id="portfolio-contact-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mail-modal-title"
            aria-describedby="mail-modal-description"
            className={`mail-modal${closing ? " mail-modal--closing" : ""}`}
            data-submission={submission}
            aria-busy={submission === "sending"}
            inert={submission === "launching" || closing}
            ref={dialogRef}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && event.animationName === "mail-v19-dialog-close") {
                setOpen(false);
                setClosing(false);
              }
            }}
          >
            <div className="mail-modal-optic-surface" aria-hidden="true" />
            <svg className="mail-modal-fold-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="mail-modal-fold-wing mail-modal-fold-wing--left" d="M0 0 50 50 0 100Z" />
              <path className="mail-modal-fold-wing mail-modal-fold-wing--right" d="M100 0 50 50 100 100Z" />
              <path className="mail-modal-fold-crease" d="M0 0 50 50 0 100M100 0 50 50 100 100" />
            </svg>
            <div className="mail-modal-inner">
              <div className="mail-modal-topline">
                <span className="mono mail-modal-eyebrow"><span className="mail-modal-signal" /> DIRECT CONNECTION <span className="mail-modal-optics-label">REFRACTIVE / ACTIVE</span></span>
                <button type="button" className="mail-modal-close" onClick={closeContact} aria-label="Close contact form" disabled={submission === "sending" || submission === "launching" || closing}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                </button>
              </div>

              <div className="mail-modal-heading">
                <span className="mail-modal-emblem">
                  {submission === "sent" ? (
                    <svg className="mail-modal-emblem-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : <EnvelopeIcon />}
                </span>
                <div>
                  <h2 id="mail-modal-title">Start a conversation.</h2>
                  <p id="mail-modal-description">Have a project, an opportunity, or an idea worth exploring? Send me a note.</p>
                </div>
              </div>

              <form className="mail-modal-form" onSubmit={sendMessage}>
              {submission === "sending" ? (
                <div className="mail-modal-delivery" role="status" aria-live="polite" aria-label="Sending your message">
                  <div className="mail-delivery-scene" aria-hidden="true">
                    <span className="mail-delivery-orbit mail-delivery-orbit--one" />
                    <span className="mail-delivery-orbit mail-delivery-orbit--two" />
                    <svg className="mail-delivery-art" viewBox="0 0 220 132" fill="none">
                      <path className="mail-delivery-envelope-shadow" d="M35 48h150v65H35z" />
                      <path className="mail-delivery-letter" d="M65 20h90v78H65z" />
                      <path className="mail-delivery-letter-line" d="M80 42h57M80 54h48M80 66h53" />
                      <path className="mail-delivery-envelope-back" d="M35 48 110 96l75-48" />
                      <path className="mail-delivery-envelope-front" d="M35 48v59a6 6 0 0 0 6 6h138a6 6 0 0 0 6-6V48l-75 50L35 48Z" />
                      <path className="mail-delivery-envelope-flap" d="m36 49 69 44a9 9 0 0 0 10 0l69-44" />
                    </svg>
                    <span className="mail-delivery-trail mail-delivery-trail--one" />
                    <span className="mail-delivery-trail mail-delivery-trail--two" />
                  </div>
                  <strong>Sending your message</strong>
                  <span>Your note is on its way.</span>
                  <span className="mail-delivery-progress" />
                </div>
              ) : submission === "sent" ? (
                <div className="mail-modal-delivery mail-modal-delivery--sent" role="status" aria-live="polite">
                  <span className="mail-delivery-success">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <strong>Message sent!</strong>
                  <span>Thanks for reaching out — I&apos;ll be in touch.</span>
                </div>
              ) : (
                <>
                  <div className="mail-modal-pair">
                    <label>NAME
                      <input ref={nameRef} name="name" type="text" autoComplete="name" placeholder="Jane Smith" minLength={2} maxLength={120} value={fields.name} onChange={(event) => updateField("name", event.target.value)} required disabled={submission === "launching"} />
                    </label>
                    <label>EMAIL ADDRESS
                      <input name="user_email" type="email" autoComplete="email" placeholder="jane@company.com" maxLength={254} value={fields.user_email} onChange={(event) => updateField("user_email", event.target.value)} required disabled={submission === "launching"} />
                    </label>
                  </div>
                  <label>MESSAGE
                    <textarea name="message" rows={5} placeholder="Tell me a little about what you have in mind…" minLength={10} maxLength={3000} value={fields.message} onChange={(event) => updateField("message", event.target.value)} required disabled={submission === "launching"} />
                  </label>
                </>
              )}
              <div className="mail-modal-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

              {!emailConfigured && submission !== "sending" && submission !== "sent" && (
                <p className="mail-modal-setup" role="status">
                  EmailJS setup needed: add your public Service ID, Template ID, and Public Key in <code>.env.local</code> to enable sending.
                </p>
              )}

              {message && submission === "error" && (
                <p className={`mail-modal-feedback is-${submission}`} role="status" aria-live="polite">{message}</p>
              )}

              <div className="mail-modal-footer">
                {submission !== "sending" && submission !== "sent" && submission !== "launching" && (
                  <div className="mail-modal-validation" id="mail-modal-validation-hint" aria-live="polite">
                    <span className="mono mail-modal-aside">{formHint}</span>
                    <span className="mail-modal-valid-indicators" aria-hidden="true">
                      {fieldReady.map((ready, index) => <i key={index} className={ready ? "is-valid" : undefined} />)}
                    </span>
                  </div>
                )}
                <button
                  type="submit"
                  className="mail-modal-submit"
                  disabled={!canSend}
                  aria-describedby={
                    submission !== "sending" && submission !== "sent" && submission !== "launching" && !formValid
                      ? "mail-modal-validation-hint"
                      : undefined
                  }
                >
                  {submission === "sending" ? "Sending…" : submission === "sent" ? "Sent!" : "Send message"}
                  {submission === "sending" ? (
                    <span className="mail-modal-spinner" aria-hidden="true" />
                  ) : submission === "sent" ? (
                    <svg className="mail-modal-submit-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 14-7-5 14-2.8-6.2L5 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="m11.2 12.8 7.8-7.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
          {submission === "launching" && (
            <svg className="mail-modal-flight" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M3 14.2 29 3 19.8 29l-4.1-10.2L3 14.2Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m15.7 18.8 7.1-9.1-9.3 6.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
    </>
  );
}
