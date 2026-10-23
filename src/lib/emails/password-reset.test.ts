import { describe, expect, it } from "vitest";

import { passwordResetEmail } from "./password-reset";

describe("passwordResetEmail", () => {
  it("includes the link in both versions", () => {
    const email = passwordResetEmail({ name: "Ali", link: "https://x.uz/reset-password/abc" });
    expect(email.text).toContain("https://x.uz/reset-password/abc");
    expect(email.html).toContain('href="https://x.uz/reset-password/abc"');
    expect(email.text).toContain("Salom, Ali!");
  });

  it("escapes the name in HTML", () => {
    const email = passwordResetEmail({ name: "<b>x</b>", link: "https://x.uz/r" });
    expect(email.html).not.toContain("<b>x</b>");
    expect(email.html).toContain("&#60;b&#62;x&#60;/b&#62;");
  });
});
