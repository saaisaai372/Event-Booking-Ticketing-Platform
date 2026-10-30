// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Reserve seats</Button>);
    expect(screen.getByRole("button", { name: /reserve seats/i })).toBeInTheDocument();
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Pay</Button>);

    await user.click(screen.getByRole("button", { name: /pay/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Sold out
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: /sold out/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the destructive variant class", () => {
    render(<Button variant="destructive">Cancel booking</Button>);
    expect(screen.getByRole("button", { name: /cancel booking/i })).toHaveClass(
      "bg-destructive",
    );
  });
});
