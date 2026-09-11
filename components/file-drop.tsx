"use client";

import { useRef, useState } from "react";
import { ACCEPT, fileToText, isImage } from "@/lib/convert";

/** Files taken from one drop. Twenty is a full course load twice over. */
export const MAX_FILES = 20;
import { Camera, Upload } from "./icons";

export type ConvertedFile = {
  fileName: string;
  text: string;
  viaPhoto: boolean;
};

type Props = {
  onFiles: (files: ConvertedFile[]) => void;
  multiple?: boolean;
  hero?: boolean;
  className?: string;
};

export function FileDrop({
  onFiles,
  multiple = false,
  hero = false,
  className = "",
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  /**
   * What the zone is doing right now: the sentence it shows, and how far through the whole
   * drop it is, as a fraction of the files handed over. Within one file a PDF advances page by
   * page and a picture as the recogniser works; a Word or text file has no middle, so the bar
   * holds at the start of that file's share until it is done.
   */
  const [busy, setBusy] = useState<{ label: string; fraction: number } | null>(
    null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  // The same answer as `busy`, readable from inside an async handler that started earlier.
  const working = useRef(false);

  async function handle(list: FileList | null | undefined) {
    // A second drop while the first is being read would run both at once and double the work
    // on a tab that is already busy. It is simply not taken; the zone says it is working.
    if (working.current) return;
    const files = Array.from(list ?? []).slice(0, multiple ? MAX_FILES : 1);
    if (files.length === 0) return;
    working.current = true;
    setErrors([]);
    const done: ConvertedFile[] = [];
    const errs: string[] = [];
    const share = 1 / files.length;
    for (const [i, file] of files.entries()) {
      const prefix = files.length > 1 ? `${i + 1} of ${files.length}: ` : "";
      const at = (within: number) => Math.min(1, i * share + within * share);
      setBusy({ label: `${prefix}reading ${file.name}`, fraction: at(0) });
      try {
        const text = await fileToText(file, (stage, fraction) => {
          if (fraction === undefined) return;
          const label =
            stage === "scanning"
              ? `${prefix}reading the picture, ${Math.round(fraction * 100)}%`
              : `${prefix}reading ${file.name}`;
          setBusy({ label, fraction: at(fraction) });
        });
        done.push({ fileName: file.name, text, viaPhoto: isImage(file) });
      } catch (e) {
        // Never swallow the reason: a bare "could not read that file" is not something a
        // student can act on, and it is not something they can report back either.
        const why = e instanceof Error ? e.message : String(e ?? "").trim();
        errs.push(`${file.name}: ${why || "could not read that file."}`);
      }
    }
    working.current = false;
    setBusy(null);
    setErrors(errs);
    if (done.length) onFiles(done);
    if (input.current) input.current.value = "";
    if (camera.current) camera.current.value = "";
  }

  const idle = busy === null;
  const pct = busy ? Math.round(busy.fraction * 100) : 0;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => idle && input.current?.click()}
        onKeyDown={(e) =>
          idle && (e.key === "Enter" || e.key === " ") && input.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        aria-busy={busy !== null}
        aria-label={
          multiple
            ? "Choose or drop syllabus files"
            : "Choose or drop a syllabus file"
        }
        className={`rounded-2xl border border-dashed text-center transition-colors ${hero ? "px-6 py-9" : "px-4 py-5"} ${
          idle ? "cursor-pointer" : "cursor-progress"
        } ${over && idle ? "border-accent bg-accent-soft" : "border-line-strong bg-elev"} ${idle ? "hover:border-accent hover:bg-accent-soft/40" : ""}`}
      >
        {hero ? (
          <>
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Upload size={20} />
            </div>
            <p className="font-display text-xl">
              {busy ? capitalise(busy.label) : "Drop your syllabi here"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {busy
                ? "Finding every date as it goes."
                : "PDF, Word, a screenshot, or a photo of the page. Each file becomes a class."}
            </p>
          </>
        ) : (
          <p className="text-sm font-medium">
            {busy
              ? capitalise(busy.label)
              : "Drop a syllabus, or click to choose"}
          </p>
        )}
        {busy && (
          <div
            role="progressbar"
            aria-label="Reading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className={`progress mx-auto ${hero ? "mt-5 max-w-sm" : "mt-3 max-w-xs"}`}
          >
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />

      {idle && (
        <button
          type="button"
          onClick={() => camera.current?.click()}
          className="btn btn-ghost btn-sm mt-2 w-full sm:hidden"
        >
          <Camera size={14} /> Take a photo of the page instead
        </button>
      )}

      {errors.map((err) => (
        <p
          key={err}
          role="alert"
          className="rise mt-2 text-sm font-medium text-danger"
        >
          {err}
        </p>
      ))}
    </div>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
