import { describe, expect, it } from "vitest";

import { cloudinaryErrorMessage } from "./cloudinary-errors";

describe("cloudinaryErrorMessage", () => {
  it("points to the wrong setting", () => {
    expect(cloudinaryErrorMessage("Invalid cloud_name Root")).toMatch(/CLOUDINARY_CLOUD_NAME/);
    expect(cloudinaryErrorMessage("Invalid api_key 1234")).toMatch(/CLOUDINARY_API_KEY/);
    expect(
      cloudinaryErrorMessage("Invalid Signature abc. String to sign - 'folder=x&timestamp=1'."),
    ).toMatch(/CLOUDINARY_API_SECRET/);
  });
  it("keeps other messages short and drops the string to sign", () => {
    expect(cloudinaryErrorMessage("Something odd - String to sign - 'a=b'")).toBe(
      "Rasm yuklanmadi: Something odd",
    );
    expect(cloudinaryErrorMessage(undefined)).toBe("Rasm yuklanmadi");
  });
});
