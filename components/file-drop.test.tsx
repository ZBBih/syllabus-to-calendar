// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import { FileDrop } from "./file-drop";

afterEach(cleanup);

function drop(el: Element, files: File[]) {
  fireEvent.drop(el, { dataTransfer: { files } });
}

describe("FileDrop", () => {
  it("converts text files and reports each unsupported file without blocking the rest", async () => {
    const onFiles = vi.fn();
    render(<FileDrop multiple onFiles={onFiles} />);
    const zone = screen.getByRole("button", { name: /drop syllabus files/i });
    drop(zone, [
      new File(["Sept 14: Quiz"], "econ.txt", { type: "text/plain" }),
      new File(["x"], "notes.pages", { type: "" }),
    ]);
    await waitFor(() => expect(onFiles).toHaveBeenCalled());
    expect(onFiles.mock.calls[0][0]).toEqual([
      { fileName: "econ.txt", text: "Sept 14: Quiz", viaPhoto: false },
    ]);
    expect(
      screen.getByText(/notes\.pages: unsupported file type/i),
    ).toBeTruthy();
  });
  it("takes only the first file when not multiple", async () => {
    const onFiles = vi.fn();
    render(<FileDrop onFiles={onFiles} />);
    drop(screen.getByRole("button", { name: /drop a syllabus file/i }), [
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ]);
    await waitFor(() => expect(onFiles).toHaveBeenCalled());
    expect(onFiles.mock.calls[0][0]).toHaveLength(1);
  });

  it("shows a progress bar while it reads, and takes it down when it is done", async () => {
    vi.resetModules();
    vi.doMock("@/lib/convert", async (orig) => {
      const real = (await orig()) as typeof import("@/lib/convert");
      return {
        ...real,
        fileToText: async (
          _f: File,
          onProgress?: (
            stage: "reading" | "scanning",
            fraction?: number,
          ) => void,
        ) => {
          onProgress?.("reading", 0.5);
          await new Promise((r) => setTimeout(r, 30));
          return "Sept 14: Quiz";
        },
      };
    });
    const { FileDrop: Drop } = await import("./file-drop");
    const onFiles = vi.fn();
    render(<Drop onFiles={onFiles} />);
    drop(screen.getByRole("button", { name: /drop a syllabus file/i }), [
      new File(["x"], "a.pdf", { type: "application/pdf" }),
    ]);
    const bar = await screen.findByRole("progressbar");
    await waitFor(() => expect(bar.getAttribute("aria-valuenow")).toBe("50"));
    await waitFor(() => expect(onFiles).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
    vi.doUnmock("@/lib/convert");
  });

  it("ignores a second drop while the first is still being read", async () => {
    vi.resetModules();
    vi.doMock("@/lib/convert", async (orig) => {
      const real = (await orig()) as typeof import("@/lib/convert");
      return {
        ...real,
        fileToText: async () => {
          await new Promise((r) => setTimeout(r, 40));
          return "Sept 14: Quiz";
        },
      };
    });
    const { FileDrop: Drop } = await import("./file-drop");
    const onFiles = vi.fn();
    render(<Drop multiple onFiles={onFiles} />);
    const zone = screen.getByRole("button", { name: /drop syllabus files/i });
    drop(zone, [new File(["a"], "a.txt", { type: "text/plain" })]);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
    drop(zone, [new File(["b"], "b.txt", { type: "text/plain" })]);
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(onFiles).toHaveBeenCalledTimes(1);
    vi.doUnmock("@/lib/convert");
  });
});
