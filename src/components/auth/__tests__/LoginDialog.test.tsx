// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { LoginDialog } from "../LoginDialog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LoginDialog", () => {
  it("does not render when closed", () => {
    render(<LoginDialog open={false} onOpenChange={() => {}} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders an accessible dialog with Google sign-in link", () => {
    render(<LoginDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByRole("dialog", { name: "sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "/api/auth/login"
    );
  });

  it("closes when escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(<LoginDialog open={true} onOpenChange={onOpenChange} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the overlay is clicked", () => {
    const onOpenChange = vi.fn();
    render(<LoginDialog open={true} onOpenChange={onOpenChange} />);

    fireEvent.mouseDown(screen.getByTestId("login-dialog-overlay"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("traps focus inside the dialog", () => {
    render(<LoginDialog open={true} onOpenChange={() => {}} />);

    const closeButton = screen.getByRole("button", { name: "Close login dialog" });
    const googleLink = screen.getByRole("link", { name: "Continue with Google" });

    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(googleLink).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
    expect(googleLink).toHaveFocus();
  });
});
