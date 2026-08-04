type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
};

function readAuthError(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as AuthErrorLike;
    return {
      code: typeof candidate.code === "string" ? candidate.code : "",
      message: typeof candidate.message === "string" ? candidate.message : "",
    };
  }

  return {
    code: "",
    message: typeof error === "string" ? error : "",
  };
}

export function authErrorMessage(error: unknown) {
  const { code, message } = readAuthError(error);
  const normalized = message.toLowerCase();

  if (code === "over_email_send_rate_limit") {
    return "Doğrulama e-postası gönderim sınırına ulaşıldı. Bir saate kadar bekleyip tekrar dene.";
  }
  if (code === "over_request_rate_limit") {
    return "Bu bağlantıdan çok fazla istek gönderildi. Birkaç dakika bekleyip tekrar dene.";
  }
  if (code === "invalid_credentials" || normalized.includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (code === "email_not_confirmed" || normalized.includes("email not confirmed")) {
    return "Önce e-posta adresini doğrulamalısın.";
  }
  if (code === "user_already_exists" || normalized.includes("already registered")) {
    return "Bu e-posta ile zaten bir hesap bulunuyor.";
  }
  if (code === "weak_password" || normalized.includes("password")) {
    return "Şifre en az 8 karakter olmalı.";
  }
  if (normalized.includes("rate limit")) {
    return "Geçici istek sınırına ulaşıldı. Bir süre bekleyip tekrar dene.";
  }

  return "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.";
}
