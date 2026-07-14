import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiError, setUnauthorizedHandler } from "./client";

// A 401 from the public auth endpoints (wrong password) must surface the
// backend message as an ApiError — NOT fire the unauthorized handler, which
// logs out and reloads /login, wiping the form.
describe("apiClient 401 handling", () => {
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    onUnauthorized.mockClear();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, error: "invalid phone or password", code: "ERR_UNAUTHENTICATED" }),
          { status: 401 },
        ),
      ),
    );
  });

  it("login 401 throws the backend message and does not log out", async () => {
    await expect(apiClient.post("/api/v1/rider/auth/login", {})).rejects.toThrow(
      "invalid phone or password",
    );
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("401 on an authed endpoint still triggers the unauthorized handler", async () => {
    await expect(apiClient.get("/api/v1/rider/me")).rejects.toThrow(ApiError);
    expect(onUnauthorized).toHaveBeenCalled();
  });
});
