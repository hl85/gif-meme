"use client";

import { Logo } from "@/components/brand/Logo";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__brand">
            <Logo size={48} />
            <h1 className="login-card__title">
              Gif<span className="login-card__title--accent">Meme</span>
            </h1>
          </div>
          <p className="login-card__desc">
            Sign in to save your favorite GIFs and stickers
          </p>
        </div>

        <a className="login-card__google-btn" href="/api/auth/login">
          <span className="login-card__google-mark" aria-hidden="true">
            G
          </span>
          <span>Continue with Google</span>
        </a>
      </div>
    </div>
  );
}
