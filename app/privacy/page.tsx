import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink px-5 py-14 text-white">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan">LEGAL / PRIVACY</p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Gizlilik bildirimi</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/60">
          <p>ShiftQuest hesap açarken e-posta adresini; oyun sırasında profil tercihlerini, XP, görev cevaplarını ve kelime ilerlemesini işler. Kimlik doğrulama ve bulut kayıtları Supabase altyapısında tutulur.</p>
          <p>Gemini veya OpenAI uyumlu servisler için girdiğin API anahtarları yalnız kullandığın tarayıcının yerel deposunda saklanır. Bu anahtarlar ShiftQuest veritabanına, bulut kaydına veya JSON dışa aktarımına eklenmez.</p>
          <p>Oyun çekirdek görevleri harici AI olmadan çalışabilir. Harici sağlayıcı etkinleştirildiğinde ilgili görev metni sağlayıcının API&apos;sine gönderilir ve o sağlayıcının gizlilik koşulları geçerli olur.</p>
          <p>Verilerini Ayarlar ekranından JSON olarak dışa aktarabilir veya hesabındaki oyun ilerlemesini silebilirsin. Hesabın tamamen silinmesi için depo sahibiyle GitHub üzerinden iletişime geçebilirsin.</p>
          <p>Bu proje kişisel, açık kaynaklı bir beta çalışmasıdır; reklam ve üçüncü taraf analitik izleyici kullanmaz.</p>
        </div>
        <Link href="/" className="mt-9 inline-flex text-sm font-bold text-cyan hover:text-white">ShiftQuest&apos;e dön →</Link>
      </article>
    </main>
  );
}
