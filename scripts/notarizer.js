import dotenv from "dotenv"
import { notarize } from "@electron/notarize"

dotenv.config()

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== "darwin") {
    return
  }

  // Skip notarization if credentials are not provided or explicitly disabled
  if (
    process.env.SKIP_NOTARIZE === "1" ||
    !process.env.APPLEID ||
    !process.env.APPLEIDPASS ||
    !process.env.APPLETEAMID
  ) {
    console.log("[notarizer] Skipping notarization (missing credentials or SKIP_NOTARIZE=1)")
    return
  }

  const appName = context.packager.appInfo.productFilename

  return await notarize({
    tool: "notarytool",
    teamId: process.env.APPLETEAMID,
    appBundleId: "ai.oaphub.dive",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  })
}