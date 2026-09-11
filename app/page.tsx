"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeControl } from "@/components/theme-control";
import { Stepper } from "@/components/stepper";
import { Landing } from "@/components/landing";
import { UploadStep, canProceed } from "@/components/upload-step";
import { ReviewStep } from "@/components/review-step";
import { ExportStep } from "@/components/export-step";
import { SwRegister } from "@/components/sw-register";
import { SocialLinks, SupportLink } from "@/components/site-links";
import { initialState, reducer, type State, type Step } from "@/lib/store";
import { createSaver, load, save, STORAGE_KEY } from "@/lib/persist";

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const hydrated = useRef(false);
  // Restoring saved work lands on the render after this effect, so the save
  // effect below has to sit out that one run or it writes the empty starting
  // state over everything the browser had kept.
  const skipSave = useRef(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  // One saver for the life of the page: writing the whole state on every dispatch means
  // re-serialising every syllabus loaded for each character typed.
  const [saver] = useState(() =>
    createSaver(save, 400, (ok) => setStorageBlocked(!ok)),
  );

  // Adding to a calendar on an iPhone replaces this page with the system's import screen, so
  // the export record cannot wait for the debounce. Cancel what is queued and write it now;
  // anything still pending is this same state or older.
  const persistNow = useCallback(
    (next: State) => {
      saver.cancel();
      setStorageBlocked(!save(next));
    },
    [saver],
  );

  useEffect(() => {
    const saved = load();
    if (saved) {
      skipSave.current = true;
      // The link always opens on the front page. The classes come back with it and are one
      // click away in the bar; what does not come back is the screen the visitor left on,
      // because a shared link that lands on someone's review table is not a front door.
      dispatch({ type: "hydrate", state: { ...saved, step: 0 } });
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saver.queue(state);
  }, [state, saver]);

  // A debounced write that never lands is worse than no debounce, so anything still pending is
  // committed when the tab goes away — pagehide rather than unload, which iOS Safari ignores.
  useEffect(() => {
    const flush = () => saver.flush();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [saver]);

  // Only claim the app works offline once the worker is actually in control; before that the
  // shell and the recogniser may not be cached and the invitation would be a lie.
  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const update = () => setOfflineReady(Boolean(sw.controller));
    update();
    sw.addEventListener("controllerchange", update);
    return () => sw.removeEventListener("controllerchange", update);
  }, []);

  /**
   * The other kind of starting over.
   *
   * "Start over" keeps enough of the export history to correct the calendar it already wrote
   * to. A student on a library or a borrowed machine wants the opposite, and had no way to ask
   * for it: the only route was knowing to clear site data in browser settings. Cancelling the
   * pending write first matters, or a save already in flight lands a moment after the erase.
   */
  function eraseEverything() {
    saver.cancel();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // A browser refusing the removal is the same browser that refused to store anything.
    }
    skipSave.current = true;
    dispatch({ type: "reset" });
    setConfirmErase(false);
  }

  // Moving between steps should start you at the top of the new screen, not halfway down it.
  useEffect(() => {
    if (!hydrated.current) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const done = new Set<Step>();
  if (canProceed(state.courses)) done.add(1);
  if (state.step === 3) done.add(2);

  // A tick is earned; being reachable only takes the same gate the button on the screen uses.
  // Once the classes are named there is always something to review and something to export, so
  // stepping back to the first screen must not strand the student there.
  const reachable = new Set<Step>();
  if (canProceed(state.courses)) {
    reachable.add(2);
    reachable.add(3);
  }

  const onLanding = state.step === 0;
  const hasSavedWork =
    state.lastExport.length > 0 ||
    state.courses.some(
      (c) =>
        c.name.trim() !== "" || c.text.trim() !== "" || c.events.length > 0,
    );

  // The top bar: a clear, rounded strip that floats over the page and stays put as you scroll,
  // so the way home and the theme switch are always in reach without a solid band on top.
  const topBar = (
    <header className="sticky top-3 z-40 mb-8 flex items-center justify-between gap-3 rounded-full border border-line bg-bg/75 py-2 pl-3 pr-2 backdrop-blur-md sm:pl-4 sm:pr-2.5">
      {/* The mark always goes home, whatever step you are on. */}
      <button
        type="button"
        onClick={() => dispatch({ type: "setStep", step: 0 })}
        className="flex items-center gap-2.5"
        aria-label="Syllabify home"
      >
        <Logo size={32} />
        <span
          className={`font-display text-2xl ${onLanding ? "" : "max-[400px]:hidden"}`}
        >
          Syllabify
        </span>
      </button>
      <div className="flex items-center gap-2 sm:gap-4">
        {onLanding && (
          <button
            type="button"
            onClick={() => dispatch({ type: "setStep", step: 1 })}
            className="btn btn-primary btn-sm"
          >
            {hasSavedWork ? "Back to my classes" : "Add my syllabi"}
          </button>
        )}
        {!onLanding && (
          <Stepper
            current={state.step}
            done={done}
            reachable={reachable}
            onGo={(s) => dispatch({ type: "setStep", step: s })}
          />
        )}
        <SocialLinks size={18} className="hidden sm:flex" />
        <ThemeControl />
      </div>
    </header>
  );

  return (
    <main
      className={`mx-auto px-4 pb-24 pt-3 sm:px-6 ${onLanding ? "max-w-[90rem]" : "max-w-5xl"}`}
    >
      <SwRegister />

      {topBar}

      {storageBlocked && !onLanding && (
        <div role="alert" className="note note-warn rise mb-6">
          <strong>Your browser is blocking saving.</strong> Your classes will
          vanish if you close this tab, so download your file before you go.
        </div>
      )}

      {state.step === 0 && <Landing dispatch={dispatch} />}
      {state.step === 1 && <UploadStep state={state} dispatch={dispatch} />}
      {state.step === 2 && <ReviewStep state={state} dispatch={dispatch} />}
      {state.step === 3 && (
        <ExportStep state={state} dispatch={dispatch} persistNow={persistNow} />
      )}

      <footer className="mt-20 border-t border-line pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm leading-relaxed text-muted">
              Everything happens in this browser. Your syllabus, your photos and
              your grades are read here and never sent to a server, because
              there is no server to send them to. No account, no class limit, no
              paid tier.
            </p>
            {offlineReady && (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You do not have to take that on faith: turn on airplane mode and
                use it anyway. It all still works, because it was never talking
                to anything.
              </p>
            )}
            {hasSavedWork &&
              (confirmErase ? (
                <div className="rise mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    Erase your classes, dates and grades from this browser?
                  </span>
                  <button
                    type="button"
                    onClick={eraseEverything}
                    className="btn btn-secondary btn-sm"
                  >
                    Yes, erase everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmErase(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Keep my work
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmErase(true)}
                  className="btn btn-ghost btn-sm mt-3"
                >
                  Erase everything on this device
                </button>
              ))}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Made by Zach Weiss</span>
              <SocialLinks />
            </div>
            <SupportLink />
            {/* Which build this is. Small, but it settles "are you even looking at the fix?" at a glance. */}
            <p className="font-mono text-[11px] text-muted">
              build {process.env.NEXT_PUBLIC_BUILD_STAMP}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
