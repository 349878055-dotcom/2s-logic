import { NextResponse } from "next/server";

/** 供登录页检测：不返回任何密钥，仅返回是否已配置 */
export async function GET() {
  const clientId = !!process.env.AUTH_GOOGLE_ID?.trim();
  const clientSecret = !!process.env.AUTH_GOOGLE_SECRET?.trim();
  const authSecret = !!process.env.AUTH_SECRET?.trim();
  return NextResponse.json({
    ok: clientId && clientSecret && authSecret,
    google: { clientIdSet: clientId, clientSecretSet: clientSecret },
    authSecretSet: authSecret,
  });
}
