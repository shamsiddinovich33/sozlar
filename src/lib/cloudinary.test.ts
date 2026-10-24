import { describe, expect, it } from "vitest";

import {
  avatarUploadParams,
  getCloudinaryConfig,
  isOwnAvatarUrl,
  signCloudinaryParams,
} from "./cloudinary";

describe("signCloudinaryParams", () => {
  it("matches Cloudinary's documented example", () => {
    const signature = signCloudinaryParams(
      {
        timestamp: 1315060510,
        public_id: "sample_image",
        eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
      },
      "abcd",
    );
    expect(signature).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("binds the upload to the user's id", () => {
    expect(avatarUploadParams("user1", 1)).toMatchObject({ public_id: "user1", overwrite: "true" });
  });
});

describe("isOwnAvatarUrl", () => {
  const ok = "https://res.cloudinary.com/demo/image/upload/v1700000000/sozlik/avatars/user1.jpg";
  it("accepts this user's avatar in our cloud", () => {
    expect(isOwnAvatarUrl(ok, "demo", "user1")).toBe(true);
  });
  it("rejects other users, clouds, folders, schemes and formats", () => {
    expect(isOwnAvatarUrl(ok, "demo", "user2")).toBe(false);
    expect(isOwnAvatarUrl(ok, "other", "user1")).toBe(false);
    expect(isOwnAvatarUrl(ok.replace("sozlik/avatars", "x"), "demo", "user1")).toBe(false);
    expect(isOwnAvatarUrl(ok.replace("https", "http"), "demo", "user1")).toBe(false);
    expect(isOwnAvatarUrl(ok.replace(".jpg", ".svg"), "demo", "user1")).toBe(false);
    expect(isOwnAvatarUrl(`${ok}?x=1`, "demo", "user1")).toBe(false);
    expect(
      isOwnAvatarUrl(
        "https://evil.com/res.cloudinary.com/demo/image/upload/sozlik/avatars/user1.jpg",
        "demo",
        "user1",
      ),
    ).toBe(false);
  });
});

describe("getCloudinaryConfig", () => {
  it("requires all three variables", () => {
    expect(getCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: "a", CLOUDINARY_API_KEY: "b" })).toBeNull();
    expect(
      getCloudinaryConfig({
        CLOUDINARY_CLOUD_NAME: "a",
        CLOUDINARY_API_KEY: "b",
        CLOUDINARY_API_SECRET: "c",
      }),
    ).toEqual({ cloudName: "a", apiKey: "b", apiSecret: "c" });
  });
});

describe("getCloudinaryConfig", () => {
  it("trims pasted values and requires all three", () => {
    expect(
      getCloudinaryConfig({
        CLOUDINARY_CLOUD_NAME: " mycloud\n",
        CLOUDINARY_API_KEY: "123 ",
        CLOUDINARY_API_SECRET: "\tsecret",
      }),
    ).toEqual({ cloudName: "mycloud", apiKey: "123", apiSecret: "secret" });
    expect(getCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: "x", CLOUDINARY_API_KEY: " " })).toBeNull();
  });
});
