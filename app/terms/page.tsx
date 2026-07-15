import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ink px-5 py-14 text-white">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">LEGAL / BETA TERMS</p>
        <h1 className="mt-4 font-display text-4xl font-black uppercase">Kullanım koşulları</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/60">
          <p>ShiftQuest, kimya mühendisliği bağlamında profesyonel İngilizce pratiği sağlayan eğitim amaçlı bir beta uygulamasıdır.</p>
          <p>Uygulamadaki görevler, unvanlar ve geri bildirimler gerçek iş yetkinliği, proses güvenliği veya mesleki sertifika yerine geçmez. Gerçek tesis kararlarında kurum prosedürlerini ve yetkili uzmanları esas al.</p>
          <p>Hesabının güvenliğinden ve bağladığın harici API anahtarlarının kullanımından sen sorumlusun. Başkasına ait anahtarları kullanmamalı, hizmeti kötüye kullanmamalı veya sistemi aşırı trafikle zorlamamalısın.</p>
          <p>Beta hizmeti ücretsiz ve olduğu haliyle sunulur; kesintisiz çalışma veya veri kaybına karşı garanti verilmez. Düzenli JSON yedeği alman önerilir.</p>
          <p>Kaynak kod MIT Lisansı kapsamında yayımlanır. Üçüncü taraf hizmetlerin kendi koşulları ayrıca geçerlidir.</p>
        </div>
        <Link href="/" className="mt-9 inline-flex text-sm font-bold text-cyan hover:text-white">ShiftQuest&apos;e dön →</Link>
      </article>
    </main>
  );
}
