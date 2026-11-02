"use client";

import Image from "next/image";
import { useRef } from "react";
import certificateImage from "@/assets/fes-institute-graduation.png";

/** A compact, accessible certificate preview with a full-resolution dialog. */
export function CredentialCard() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openCertificate = () => dialogRef.current?.showModal();
  const closeCertificate = () => dialogRef.current?.close();

  return (
    <>
      <aside className="credential-card glass-panel" aria-labelledby="credential-heading">
        <div className="credential-copy">
          <p className="credential-eyebrow mono"><span className="credential-check" aria-hidden="true">✓</span> EDUCATION &amp; CREDENTIALS</p>
          <p className="credential-issuer mono">FES INSTITUTE <span aria-hidden="true">/</span> FRONTEND DEVELOPMENT</p>
          <h3 id="credential-heading">Certificate of Graduation</h3>
          <p className="credential-description">
            Completed the Frontend Development Bootcamp at FES Institute, with
            training in HTML, CSS, JavaScript, React, and modern frontend technologies.
          </p>
          <div className="credential-bottom">
            <ul className="credential-tags" aria-label="Training technologies">
              <li>React</li><li>JavaScript</li><li>HTML &amp; CSS</li>
            </ul>
            <button className="credential-open mono" type="button" onClick={openCertificate}>
              VIEW CREDENTIAL <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          className="credential-thumbnail"
          onClick={openCertificate}
          aria-label="View Keegan LaBrot's FES Institute graduation certificate full size"
        >
          <Image
            src={certificateImage}
            alt="FES Institute Certificate of Graduation awarded to Keegan LaBrot"
            sizes="(max-width: 760px) 90vw, 320px"
            className="credential-preview-image"
          />
          <span className="credential-image-hint mono" aria-hidden="true">VIEW FULL SIZE ↗</span>
        </button>
      </aside>

      <dialog
        ref={dialogRef}
        className="credential-dialog"
        aria-labelledby="credential-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCertificate();
        }}
      >
        <div className="credential-dialog-inner">
          <div className="credential-dialog-header">
            <div>
              <span className="mono">FES INSTITUTE / GRADUATION CERTIFICATE</span>
              <h2 id="credential-dialog-title">Frontend Development Bootcamp</h2>
            </div>
            <button type="button" className="credential-close" onClick={closeCertificate} aria-label="Close certificate preview">✕</button>
          </div>
          <Image
            src={certificateImage}
            alt="Certificate of Graduation from FES Institute awarded to Keegan LaBrot for completing the Frontend Development Bootcamp"
            className="credential-dialog-image"
            sizes="(max-width: 900px) 95vw, 1200px"
            priority={false}
          />
        </div>
      </dialog>
    </>
  );
}
