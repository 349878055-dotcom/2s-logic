"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { read_json_body } from "@/lib/toolkit/codec/json_codec";
import { get_auth_setup_status } from "@/lib/toolkit/transport/auth_setup_resource";

type SetupStatus = {
  ok: boolean;
  google: { clientIdSet: boolean; clientSecretSet: boolean };
  authSecretSet: boolean;
};

function LoginInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [setup, setSetup] = useState<SetupStatus | null>(null);

  useEffect(() => {
    void get_auth_setup_status()
      .then(async (r) => read_json_body(r) as Promise<SetupStatus>)
      .then(setSetup)
      .catch(() => setSetup({ ok: false, google: { clientIdSet: false, clientSecretSet: false }, authSecretSet: false }));
  }, []);

  const canGoogle = setup?.ok === true;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-[#d1d5db] px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#111] p-6 space-y-4">
        <h1 className="text-lg font-semibold text-white text-center">登录</h1>
        <p className="text-[11px] text-[#6b7280] text-center leading-relaxed">
          使用第三方账号登录后，你作为<strong className="text-[#9ca3af]">客户/用户</strong>
          ，其 OpenID、昵称、头像等由 Google / 微信按各自隐私政策处理；本应用侧请仅存储业务所需最小字段，并在隐私政策中说明用途。
        </p>
        {setup && !setup.ok ? (
          <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100/95 leading-relaxed space-y-1.5">
            <p className="font-semibold text-amber-200">尚未完成本机 OAuth 配置，Google 登录不可用：</p>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-100/80">
              {!setup.authSecretSet ? <li>缺少 <code className="text-amber-200">AUTH_SECRET</code>（应已在 .env.local）</li> : null}
              {!setup.google.clientIdSet ? <li>缺少 <code className="text-amber-200">AUTH_GOOGLE_ID</code></li> : null}
              {!setup.google.clientSecretSet ? (
                <li>
                  缺少 <code className="text-amber-200">AUTH_GOOGLE_SECRET</code>：打开 Google Cloud → 凭据 → Web 客户端 1 →
                  点「显示密钥」→ 复制整段 <code className="text-amber-200">GOCSPX-…</code>，粘贴到{" "}
                  <code className="text-amber-200">midjourney-ui/.env.local</code> 的{" "}
                  <code className="text-amber-200">AUTH_GOOGLE_SECRET=</code> 后面，保存后重启{" "}
                  <code className="text-amber-200">npm run dev</code>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!canGoogle}
          onClick={() => void signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-[#111] text-[13px] font-medium hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          使用 Google 登录
        </button>
        <button
          type="button"
          disabled
          title="需在微信开放平台创建网站应用并完成审核，再接入 OAuth 或扫码登录"
          className="w-full py-2.5 rounded-lg border border-white/10 text-[13px] text-[#4b5563] cursor-not-allowed"
        >
          微信登录（需开放平台配置）
        </button>
        {setup?.ok ? (
          <p className="text-[10px] text-[#4b5563] text-center leading-snug">
            OAuth 同意屏幕须把你的 Gmail 加入「测试用户」，否则测试阶段会拒绝登录。
          </p>
        ) : null}
        <Link href="/" className="block text-center text-[11px] text-[#6b7280] hover:text-[#9ca3af]">
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#4b5563]">加载…</div>}>
      <LoginInner />
    </Suspense>
  );
}
