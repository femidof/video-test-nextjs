import crypto from "crypto";

export function generateBunnyStreamHash(
  libraryId: string,
  apiKey: string,
  expirationTime: number,
  videoId: string
) {
  const stringToHash = libraryId + apiKey + expirationTime + videoId;
  return crypto.createHash("sha256").update(stringToHash).digest("hex");
}

export function generateBunnyStreamAuth(
  libraryId: string,
  apiKey: string,
  videoId: string,
  expiresInMinutes = 60
) {
  const expirationTime = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const hash = generateBunnyStreamHash(
    libraryId,
    apiKey,
    expirationTime,
    videoId
  );

  return {
    hash,
    expirationTime,
    expires: new Date(expirationTime * 1000).toISOString(),
  };
}
