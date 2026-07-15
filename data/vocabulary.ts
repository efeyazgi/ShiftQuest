import type { CEFRLevel, PartOfSpeech, ScenarioCategory, VocabularyItem } from "../types";

type VocabularySeed = readonly [
  id: string,
  term: string,
  meaningTr: string,
  partOfSpeech: PartOfSpeech,
  ipa: string,
  pronunciationTr: string,
  exampleEn: string,
  exampleTr: string,
  level: CEFRLevel,
];

const buildVocabulary = (
  category: ScenarioCategory,
  rows: readonly VocabularySeed[],
): VocabularyItem[] =>
  rows.map(
    ([id, term, meaningTr, partOfSpeech, ipa, pronunciationTr, exampleEn, exampleTr, level]) => ({
      id,
      term,
      meaningTr,
      partOfSpeech,
      ipa,
      pronunciationTr,
      exampleEn,
      exampleTr,
      category,
      level,
      tags: [category, level.toLowerCase(), partOfSpeech.replace(" ", "-")],
      audioText: term,
    }),
  );

export const officeVocabulary = buildVocabulary("office", [
  ["office-follow-up", "follow up", "takip etmek", "phrasal verb", "/ˈfɒləʊ ʌp/", "folov ap", "I will follow up with the design team tomorrow.", "Yarın tasarım ekibiyle konuyu takip edeceğim.", "B1"],
  ["office-walk-through", "walk me through", "adım adım anlatmak", "phrase", "/wɔːk miː θruː/", "vok mi tru", "Could you walk me through the new form?", "Yeni formu bana adım adım anlatabilir misin?", "B1"],
  ["office-keep-updated", "keep someone updated", "birini gelişmelerden haberdar etmek", "phrase", "/kiːp ˈsʌmwʌn ʌpˈdeɪtɪd/", "kiip samvan apdeytıd", "I’ll keep you updated on the task.", "Görevle ilgili seni gelişmelerden haberdar edeceğim.", "B1"],
  ["office-double-check", "double-check", "tekrar kontrol etmek", "verb", "/ˌdʌbəl ˈtʃek/", "dabıl çek", "Let me double-check the figures before I reply.", "Yanıtlamadan önce rakamları tekrar kontrol edeyim.", "B1"],
  ["office-deadline", "deadline", "son teslim tarihi", "noun", "/ˈdedlaɪn/", "dedlayn", "The deadline is Friday afternoon.", "Son teslim tarihi cuma öğleden sonra.", "B1"],
  ["office-workload", "workload", "iş yükü", "noun", "/ˈwɜːkləʊd/", "vörkloud", "My workload is quite heavy this week.", "Bu hafta iş yüküm oldukça fazla.", "B1"],
  ["office-priority", "priority", "öncelik", "noun", "/praɪˈɒrəti/", "prayorıti", "Which request should be my first priority?", "Hangi talep ilk önceliğim olmalı?", "B1"],
  ["office-feedback", "feedback", "geri bildirim", "noun", "/ˈfiːdbæk/", "fiidbek", "Could I get your feedback on this draft?", "Bu taslak hakkında geri bildiriminizi alabilir miyim?", "B1"],
  ["office-task-status", "task status", "görevin durumu", "phrase", "/tɑːsk ˈsteɪtəs/", "task steytıs", "The task status is shown on the board.", "Görevin durumu panoda gösteriliyor.", "B1"],
  ["office-get-back", "get back to someone", "birine geri dönüş yapmak", "phrase", "/ɡet bæk tə ˈsʌmwʌn/", "get bek tı samvan", "I’ll get back to you shortly.", "Size kısa süre içinde geri döneceğim.", "B1"],
  ["office-necessary-changes", "make the necessary changes", "gerekli değişiklikleri yapmak", "phrase", "/meɪk ðə ˈnesəsəri ˈtʃeɪndʒɪz/", "meyk dı nesısırı çeyncız", "I’ll make the necessary changes today.", "Gerekli değişiklikleri bugün yapacağım.", "B1"],
  ["office-point-out", "point out", "belirtmek; dikkat çekmek", "phrasal verb", "/pɔɪnt aʊt/", "point aut", "Thanks for pointing that out.", "Buna dikkat çektiğiniz için teşekkürler.", "B1"],
  ["office-available", "available", "müsait; erişilebilir", "adjective", "/əˈveɪləbəl/", "ıveylıbıl", "Are you available for a quick call?", "Kısa bir görüşme için müsait misiniz?", "B1"],
  ["office-clarify", "clarify", "açıklığa kavuşturmak", "verb", "/ˈklærəfaɪ/", "klerıfay", "Could you clarify what you mean?", "Ne demek istediğinizi açıklayabilir misiniz?", "B1"],
  ["office-draft", "draft", "taslak", "noun", "/drɑːft/", "draft", "I attached the first draft of the report.", "Raporun ilk taslağını ekledim.", "B2"],
  ["office-attachment", "attachment", "e-posta eki", "noun", "/əˈtætʃmənt/", "ıteçmınt", "The spreadsheet is included as an attachment.", "Elektronik tablo e-posta eki olarak dahil edildi.", "B2"],
  ["office-reschedule", "reschedule", "yeniden zamanlamak", "verb", "/ˌriːˈʃedjuːl/", "rişedyul", "Could we reschedule our review for Thursday?", "İncelememizi perşembeye yeniden planlayabilir miyiz?", "B2"],
  ["office-be-responsible", "be responsible for", "-den sorumlu olmak", "phrase", "/bi rɪˈspɒnsəbəl fɔː/", "bi risponsıbıl for", "I’m responsible for updating the weekly tracker.", "Haftalık takip çizelgesini güncellemekten sorumluyum.", "B2"],
] as const);

export const productionVocabulary = buildVocabulary("production", [
  ["production-behind-schedule", "behind schedule", "programın gerisinde", "phrase", "/bɪˈhaɪnd ˈʃedjuːl/", "bihaynd şedyul", "We are slightly behind schedule today.", "Bugün programın biraz gerisindeyiz.", "B1"],
  ["production-shift-handover", "shift handover", "vardiya teslimi", "noun", "/ʃɪft ˈhændəʊvə/", "şift hendovır", "The shift handover starts at seven.", "Vardiya teslimi saat yedide başlıyor.", "B1"],
  ["production-batch", "batch", "üretim partisi", "noun", "/bætʃ/", "beç", "This batch is planned for the morning shift.", "Bu parti sabah vardiyası için planlandı.", "B1"],
  ["production-operator", "operator", "operatör", "noun", "/ˈɒpəreɪtə/", "opıreytır", "The operator shared the latest update.", "Operatör son güncellemeyi paylaştı.", "B1"],
  ["production-equipment-status", "equipment status", "ekipman durumu", "phrase", "/ɪˈkwɪpmənt ˈsteɪtəs/", "ikvipmınt steytıs", "Could you confirm the equipment status?", "Ekipman durumunu teyit edebilir misiniz?", "B1"],
  ["production-downtime", "downtime", "duruş süresi", "noun", "/ˈdaʊntaɪm/", "dauntaym", "The supervisor asked about the downtime.", "Süpervizör duruş süresini sordu.", "B2"],
  ["production-take-sample", "take a sample", "numune almak", "phrase", "/teɪk ə ˈsɑːmpəl/", "teyk ı sampıl", "Could someone take a sample for the lab?", "Biri laboratuvar için numune alabilir mi?", "B1"],
  ["production-output", "output", "üretim miktarı; çıktı", "noun", "/ˈaʊtpʊt/", "autput", "Today’s output is close to the target.", "Bugünkü üretim miktarı hedefe yakın.", "B1"],
  ["production-plan", "production plan", "üretim planı", "phrase", "/prəˈdʌkʃən plæn/", "prodakşın plen", "Let’s review the production plan together.", "Üretim planını birlikte gözden geçirelim.", "B1"],
  ["production-minor-issue", "minor issue", "küçük sorun", "phrase", "/ˈmaɪnə ˈɪʃuː/", "maynır işu", "There was a minor issue during the shift.", "Vardiya sırasında küçük bir sorun oldu.", "B1"],
  ["production-major-issue", "major issue", "büyük/ciddi sorun", "phrase", "/ˈmeɪdʒə ˈɪʃuː/", "meycır işu", "The shift ended without any major issues.", "Vardiya ciddi bir sorun olmadan sona erdi.", "B1"],
  ["production-report-issue", "report an issue", "bir sorunu bildirmek", "phrase", "/rɪˈpɔːt ən ˈɪʃuː/", "riport ın işu", "Please report the issue to the supervisor.", "Lütfen sorunu süpervizöre bildirin.", "B1"],
  ["production-investigate", "investigate", "araştırmak; incelemek", "verb", "/ɪnˈvestɪɡeɪt/", "investıgeyt", "We need to investigate the delay.", "Gecikmeyi araştırmamız gerekiyor.", "B2"],
  ["production-supervisor", "supervisor", "süpervizör; amir", "noun", "/ˈsuːpəvaɪzə/", "supırvayzır", "We should discuss this with the supervisor.", "Bunu süpervizörle görüşmeliyiz.", "B1"],
  ["production-logbook", "logbook", "kayıt defteri", "noun", "/ˈlɒɡbʊk/", "logbuk", "The note is recorded in the shift logbook.", "Not vardiya kayıt defterine işlendi.", "B2"],
  ["production-run-smoothly", "run smoothly", "sorunsuz ilerlemek", "phrase", "/rʌn ˈsmuːðli/", "ran smuudli", "Production ran smoothly after lunch.", "Üretim öğle yemeğinden sonra sorunsuz ilerledi.", "B1"],
  ["production-delay", "delay", "gecikme", "noun", "/dɪˈleɪ/", "diley", "We need to explain the delay clearly.", "Gecikmeyi açıkça anlatmamız gerekiyor.", "B1"],
  ["production-current-status", "current status", "mevcut durum", "phrase", "/ˈkʌrənt ˈsteɪtəs/", "karınt steytıs", "What is the current status of the line?", "Hattın mevcut durumu nedir?", "B2"],
] as const);

export const meetingVocabulary = buildVocabulary("meeting", [
  ["meeting-agenda", "agenda", "gündem", "noun", "/əˈdʒendə/", "ıcendı", "The first item on the agenda is the timeline.", "Gündemin ilk maddesi zaman çizelgesi.", "B1"],
  ["meeting-action-item", "action item", "aksiyon maddesi", "phrase", "/ˈækʃən ˈaɪtəm/", "ekşın aytım", "Let’s assign an owner to each action item.", "Her aksiyon maddesine bir sorumlu atayalım.", "B1"],
  ["meeting-minutes", "meeting minutes", "toplantı tutanağı", "noun", "/ˈmiːtɪŋ ˈmɪnɪts/", "miiting minıts", "I’ll send the meeting minutes this afternoon.", "Toplantı tutanağını bu öğleden sonra göndereceğim.", "B1"],
  ["meeting-share-opinion", "share an opinion", "görüş belirtmek", "phrase", "/ʃeə ən əˈpɪnjən/", "şer ın opinyın", "May I share my opinion on this option?", "Bu seçenek hakkındaki görüşümü paylaşabilir miyim?", "B1"],
  ["meeting-agree", "agree", "aynı fikirde olmak", "verb", "/əˈɡriː/", "ıgrii", "I agree with the proposed timeline.", "Önerilen zaman çizelgesine katılıyorum.", "B1"],
  ["meeting-disagree-politely", "disagree politely", "kibarca katılmamak", "phrase", "/ˌdɪsəˈɡriː pəˈlaɪtli/", "disıgrii pılaytli", "It is possible to disagree politely in a meeting.", "Bir toplantıda kibarca katılmamak mümkündür.", "B1"],
  ["meeting-clarify-meaning", "Could you clarify what you mean?", "Ne demek istediğinizi açıklayabilir misiniz?", "phrase", "/kʊd juː ˈklærəfaɪ wɒt juː miːn/", "kud yu klerıfay vat yu miin", "Could you clarify what you mean by ‘urgent’?", "‘Acil’ derken ne demek istediğinizi açıklayabilir misiniz?", "B1"],
  ["meeting-elaborate", "elaborate", "ayrıntı vermek", "verb", "/ɪˈlæbəreɪt/", "ilebıreyt", "Could you elaborate on the second point?", "İkinci noktayı biraz açabilir misiniz?", "B2"],
  ["meeting-summarize", "summarize", "özetlemek", "verb", "/ˈsʌməraɪz/", "samırayz", "I’ll summarize the key decisions at the end.", "Temel kararları sonunda özetleyeceğim.", "B1"],
  ["meeting-bring-up", "bring up", "konuyu gündeme getirmek", "phrasal verb", "/brɪŋ ʌp/", "bring ap", "She brought up a useful concern.", "Faydalı bir endişeyi gündeme getirdi.", "B2"],
  ["meeting-go-over", "go over", "gözden geçirmek", "phrasal verb", "/ɡəʊ ˈəʊvə/", "gou ouvır", "Let’s go over the action items.", "Aksiyon maddelerini gözden geçirelim.", "B1"],
  ["meeting-take-notes", "take notes", "not almak", "phrase", "/teɪk nəʊts/", "teyk nouts", "Can you take notes during the call?", "Görüşme sırasında not alabilir misin?", "B1"],
  ["meeting-contribute", "contribute", "katkıda bulunmak", "verb", "/kənˈtrɪbjuːt/", "kıntribyut", "Everyone had a chance to contribute.", "Herkes katkıda bulunma fırsatı buldu.", "B2"],
  ["meeting-postpone", "postpone", "ertelemek", "verb", "/pəˈspəʊn/", "pıspoun", "We may need to postpone the decision.", "Kararı ertelememiz gerekebilir.", "B2"],
  ["meeting-consensus", "reach a consensus", "uzlaşmaya varmak", "phrase", "/riːtʃ ə kənˈsensəs/", "riiç ı kınsensıs", "The team reached a consensus after discussion.", "Ekip görüşmeden sonra uzlaşmaya vardı.", "B2"],
  ["meeting-concern", "concern", "endişe; kaygı", "noun", "/kənˈsɜːn/", "kınsörn", "I’d like to raise one concern about timing.", "Zamanlamayla ilgili bir endişeyi dile getirmek istiyorum.", "B2"],
  ["meeting-perspective", "perspective", "bakış açısı", "noun", "/pəˈspektɪv/", "pıspektiv", "From a quality perspective, we need more time.", "Kalite bakış açısından daha fazla zamana ihtiyacımız var.", "B2"],
  ["meeting-interrupt", "interrupt", "sözünü kesmek", "verb", "/ˌɪntəˈrʌpt/", "intırapt", "Sorry to interrupt, but may I add something?", "Sözünüzü kestiğim için üzgünüm ama bir şey ekleyebilir miyim?", "B2"],
] as const);

export const qualityVocabulary = buildVocabulary("quality", [
  ["quality-missing-document", "missing document", "eksik belge", "phrase", "/ˈmɪsɪŋ ˈdɒkjəmənt/", "mising dokyumınt", "We noticed a missing document in the file.", "Dosyada eksik bir belge fark ettik.", "B1"],
  ["quality-under-review", "under review", "inceleme altında", "phrase", "/ˈʌndə rɪˈvjuː/", "andır rivyu", "The document is still under review.", "Belge hâlâ inceleme altında.", "B1"],
  ["quality-check-team", "check with the quality team", "kalite ekibine danışmak", "phrase", "/tʃek wɪð ðə ˈkwɒləti tiːm/", "çek vid dı kuolıti tiim", "I’ll check with the quality team first.", "Önce kalite ekibine danışacağım.", "B1"],
  ["quality-according-procedure", "according to the procedure", "prosedüre göre", "phrase", "/əˈkɔːdɪŋ tə ðə prəˈsiːdʒə/", "ıkording tı dı prosicır", "According to the procedure, the form needs a date.", "Prosedüre göre formda tarih bulunmalı.", "B1"],
  ["quality-approval", "approval", "onay", "noun", "/əˈpruːvəl/", "ıpruuvıl", "We may need approval from the quality team.", "Kalite ekibinden onay almamız gerekebilir.", "B1"],
  ["quality-batch-record", "batch record", "parti kayıt formu", "noun", "/bætʃ ˈrekɔːd/", "beç rekord", "Please check the batch record for missing fields.", "Lütfen parti kayıt formunda eksik alan olup olmadığını kontrol edin.", "B1"],
  ["quality-sop", "standard operating procedure (SOP)", "standart çalışma prosedürü", "noun", "/ˈstændəd ˈɒpəreɪtɪŋ prəˈsiːdʒə/", "stendırd opıreyting prosicır", "The SOP is available in the document system.", "SOP belge sisteminde mevcut.", "B1"],
  ["quality-deviation", "deviation", "sapma", "noun", "/ˌdiːviˈeɪʃən/", "diiviyeyşın", "Quality is reviewing the deviation report.", "Kalite, sapma raporunu inceliyor.", "B2"],
  ["quality-corrective-action", "corrective action", "düzeltici faaliyet", "phrase", "/kəˈrektɪv ˈækʃən/", "kırektiv ekşın", "The team agreed on a corrective action.", "Ekip bir düzeltici faaliyet üzerinde anlaştı.", "B2"],
  ["quality-form", "form", "form", "noun", "/fɔːm/", "form", "There is an error in the form.", "Formda bir hata var.", "B1"],
  ["quality-signature", "signature", "imza", "noun", "/ˈsɪɡnətʃə/", "signıçır", "This page needs a signature and a date.", "Bu sayfaya imza ve tarih gerekiyor.", "B1"],
  ["quality-revision", "revision", "revizyon", "noun", "/rɪˈvɪʒən/", "rivijın", "Please use the latest revision of the form.", "Lütfen formun en son revizyonunu kullanın.", "B2"],
  ["quality-comply", "comply with", "uymak", "phrasal verb", "/kəmˈplaɪ wɪð/", "kımplay vid", "The record must comply with the documentation rules.", "Kayıt, dokümantasyon kurallarına uymalıdır.", "B2"],
  ["quality-documentation", "documentation", "dokümantasyon", "noun", "/ˌdɒkjəmenˈteɪʃən/", "dokyumenteyşın", "Clear documentation helps the whole team.", "Açık dokümantasyon tüm ekibe yardımcı olur.", "B1"],
  ["quality-traceability", "traceability", "izlenebilirlik", "noun", "/ˌtreɪsəˈbɪləti/", "treysıbilıti", "Accurate dates support traceability.", "Doğru tarihler izlenebilirliği destekler.", "B2"],
  ["quality-accurate", "accurate", "doğru; hatasız", "adjective", "/ˈækjərət/", "ekyurıt", "Make sure the information is accurate.", "Bilginin doğru olduğundan emin olun.", "B1"],
  ["quality-discrepancy", "discrepancy", "tutarsızlık", "noun", "/dɪˈskrepənsi/", "diskrepınsi", "I found a discrepancy between the two records.", "İki kayıt arasında bir tutarsızlık buldum.", "B2"],
  ["quality-verify", "verify", "doğrulamak", "verb", "/ˈverɪfaɪ/", "verıfay", "Could you verify the document number?", "Belge numarasını doğrulayabilir misiniz?", "B2"],
] as const);

export const safetyVocabulary = buildVocabulary("safety", [
  ["safety-ppe", "personal protective equipment (PPE)", "kişisel koruyucu donanım", "noun", "/ˈpɜːsənəl prəˈtektɪv ɪˈkwɪpmənt/", "pörsınıl protektiv ikvipmınt", "The sign reminds visitors to wear the required PPE.", "Levha, ziyaretçilere gerekli KKD’yi giymelerini hatırlatıyor.", "B1"],
  ["safety-unsafe-condition", "unsafe condition", "güvenli olmayan durum", "phrase", "/ʌnˈseɪf kənˈdɪʃən/", "anseif kındişın", "I’d like to report an unsafe condition.", "Güvenli olmayan bir durumu bildirmek istiyorum.", "B1"],
  ["safety-work-permit", "work permit", "çalışma izni", "noun", "/wɜːk ˈpɜːmɪt/", "vörk pörmit", "Who can confirm whether the work permit is valid?", "Çalışma izninin geçerli olup olmadığını kim teyit edebilir?", "B1"],
  ["safety-emergency-exit", "emergency exit", "acil çıkış", "noun", "/ɪˈmɜːdʒənsi ˈeɡzɪt/", "imörcınsi egzit", "The guide pointed out the emergency exit.", "Rehber acil çıkışı gösterdi.", "B1"],
  ["safety-warning-sign", "warning sign", "uyarı levhası", "noun", "/ˈwɔːnɪŋ saɪn/", "vorning sayn", "Please tell the supervisor about the damaged warning sign.", "Lütfen hasarlı uyarı levhasını süpervizöre bildirin.", "B1"],
  ["safety-spill", "spill", "dökülme", "noun", "/spɪl/", "spil", "I can see a spill near the marked walkway.", "İşaretli yürüme yolunun yanında bir dökülme görüyorum.", "B1"],
  ["safety-leak", "leak", "sızıntı", "noun", "/liːk/", "liik", "The operator reported a possible leak.", "Operatör olası bir sızıntıyı bildirdi.", "B1"],
  ["safety-report-immediately", "report immediately", "hemen bildirmek", "phrase", "/rɪˈpɔːt ɪˈmiːdiətli/", "riport imiidiyıtli", "Please report the observation immediately.", "Lütfen gözlemi hemen bildirin.", "B1"],
  ["safety-restricted-area", "restricted area", "girişi kısıtlı alan", "noun", "/rɪˈstrɪktɪd ˈeəriə/", "ristriktıd erya", "The sign says this is a restricted area.", "Levha buranın girişi kısıtlı bir alan olduğunu söylüyor.", "B1"],
  ["safety-evacuation", "evacuation", "tahliye", "noun", "/ɪˌvækjuˈeɪʃən/", "ivekyueyşın", "The safety briefing explains the evacuation message.", "Güvenlik bilgilendirmesi tahliye mesajını açıklıyor.", "B2"],
  ["safety-assembly-point", "assembly point", "toplanma noktası", "noun", "/əˈsembli pɔɪnt/", "ısembli point", "The map shows the nearest assembly point.", "Harita en yakın toplanma noktasını gösteriyor.", "B1"],
  ["safety-hazard", "hazard", "tehlike kaynağı", "noun", "/ˈhæzəd/", "hezırd", "Could you describe the hazard clearly?", "Tehlike kaynağını açıkça tarif edebilir misiniz?", "B2"],
  ["safety-incident", "incident", "olay", "noun", "/ˈɪnsɪdənt/", "insıdınt", "The incident was reported to the safety team.", "Olay güvenlik ekibine bildirildi.", "B1"],
  ["safety-precaution", "precaution", "önlem", "noun", "/prɪˈkɔːʃən/", "prikoşın", "Ask the safety specialist which precautions apply.", "Hangi önlemlerin geçerli olduğunu güvenlik uzmanına sorun.", "B2"],
  ["safety-briefing", "safety briefing", "güvenlik bilgilendirmesi", "noun", "/ˈseɪfti ˈbriːfɪŋ/", "seyfti briifing", "The visitor joined the safety briefing.", "Ziyaretçi güvenlik bilgilendirmesine katıldı.", "B1"],
  ["safety-near-miss", "near miss", "ramak kala olay", "noun", "/ˌnɪə ˈmɪs/", "niır mis", "Please report a near miss even if nobody was hurt.", "Kimse yaralanmasa bile ramak kala olayı bildirin.", "B2"],
  ["safety-keep-clear", "keep clear", "boş tutmak; yaklaşmamak", "phrase", "/kiːp klɪə/", "kiip kliır", "The sign asks everyone to keep the doorway clear.", "Levha herkesten kapı önünü boş tutmasını istiyor.", "B1"],
  ["safety-follow-instructions", "follow the instructions", "talimatlara uymak", "phrase", "/ˈfɒləʊ ði ɪnˈstrʌkʃənz/", "folov di instrakşınz", "Please follow the instructions from the safety team.", "Lütfen güvenlik ekibinin talimatlarına uyun.", "B1"],
] as const);

export const careerVocabulary = buildVocabulary("career", [
  ["career-strength", "strength", "güçlü yön", "noun", "/streŋθ/", "strengt", "Clear communication is one of my strengths.", "Açık iletişim güçlü yönlerimden biridir.", "B1"],
  ["career-development-area", "development area", "gelişim alanı", "phrase", "/dɪˈveləpmənt ˈeəriə/", "divelıpmınt erya", "Public speaking is a development area for me.", "Topluluk önünde konuşma benim için bir gelişim alanı.", "B2"],
  ["career-interview", "job interview", "iş görüşmesi", "noun", "/dʒɒb ˈɪntəvjuː/", "cob intıvyu", "I have a job interview on Monday.", "Pazartesi bir iş görüşmem var.", "B1"],
  ["career-introduce", "introduce yourself", "kendini tanıtmak", "phrase", "/ˌɪntrəˈdjuːs jɔːˈself/", "introdüus yorself", "Please introduce yourself to the team.", "Lütfen kendinizi ekibe tanıtın.", "B1"],
  ["career-internship", "internship", "staj", "noun", "/ˈɪntɜːnʃɪp/", "intörnşip", "I completed an internship in a quality laboratory.", "Bir kalite laboratuvarında staj yaptım.", "B1"],
  ["career-hands-on-experience", "hands-on experience", "uygulamalı deneyim", "phrase", "/ˌhændz ˈɒn ɪkˈspɪəriəns/", "hendz on ikspiryıns", "The project gave me hands-on experience.", "Proje bana uygulamalı deneyim kazandırdı.", "B2"],
  ["career-responsibility", "responsibility", "sorumluluk", "noun", "/rɪˌspɒnsəˈbɪləti/", "risponsıbilıti", "My main responsibility was preparing weekly summaries.", "Temel sorumluluğum haftalık özetleri hazırlamaktı.", "B1"],
  ["career-achievement", "achievement", "başarı", "noun", "/əˈtʃiːvmənt/", "ıçiivmınt", "Completing the project early was a team achievement.", "Projeyi erken tamamlamak bir ekip başarısıydı.", "B2"],
  ["career-available-start", "available to start", "işe başlamaya müsait", "phrase", "/əˈveɪləbəl tə stɑːt/", "ıveylıbıl tı start", "I am available to start next month.", "Gelecek ay işe başlamaya müsaitim.", "B1"],
  ["career-teamwork", "teamwork", "takım çalışması", "noun", "/ˈtiːmwɜːk/", "tiimvörk", "Good teamwork helped us meet the deadline.", "İyi takım çalışması son teslim tarihine yetişmemizi sağladı.", "B1"],
  ["career-problem-solving", "problem-solving", "problem çözme", "noun", "/ˈprɒbləm ˌsɒlvɪŋ/", "problım solving", "The role requires practical problem-solving skills.", "Pozisyon pratik problem çözme becerileri gerektiriyor.", "B2"],
  ["career-lunch-break", "lunch break", "öğle arası", "noun", "/lʌntʃ breɪk/", "lanç breyk", "Would you like to join us for lunch break?", "Öğle arasında bize katılmak ister misiniz?", "B1"],
  ["career-congratulate", "congratulate", "tebrik etmek", "verb", "/kənˈɡrætʃəleɪt/", "kıngreçuleyt", "I called to congratulate her on the promotion.", "Terfisi için onu tebrik etmek üzere aradım.", "B1"],
  ["career-request-leave", "request leave", "izin istemek", "phrase", "/rɪˈkwest liːv/", "rikvest liiv", "I’d like to request leave for Friday afternoon.", "Cuma öğleden sonrası için izin istemek istiyorum.", "B1"],
  ["career-phone-call", "professional phone call", "profesyonel telefon görüşmesi", "phrase", "/prəˈfeʃənəl fəʊn kɔːl/", "profeşınıl foun kol", "She handled the professional phone call confidently.", "Profesyonel telefon görüşmesini güvenle yürüttü.", "B2"],
  ["career-transfer-call", "transfer a call", "görüşmeyi aktarmak", "phrase", "/trænsˈfɜː ə kɔːl/", "transför ı kol", "May I transfer your call to the project manager?", "Görüşmenizi proje yöneticisine aktarabilir miyim?", "B1"],
  ["career-leave-message", "leave a message", "mesaj bırakmak", "phrase", "/liːv ə ˈmesɪdʒ/", "liiv ı mesıc", "Would you like to leave a message?", "Mesaj bırakmak ister misiniz?", "B1"],
  ["career-professional-network", "professional network", "profesyonel çevre", "noun", "/prəˈfeʃənəl ˈnetwɜːk/", "profeşınıl netvörk", "The event helped me expand my professional network.", "Etkinlik profesyonel çevremi genişletmeme yardımcı oldu.", "B2"],
] as const);

/** 108 complete cards: 18 for each of the six scenario categories. */
export const vocabulary: VocabularyItem[] = [
  ...officeVocabulary,
  ...productionVocabulary,
  ...meetingVocabulary,
  ...qualityVocabulary,
  ...safetyVocabulary,
  ...careerVocabulary,
];

export const vocabularyById = new Map(vocabulary.map((item) => [item.id, item]));

export const getVocabularyById = (id: string): VocabularyItem | undefined => vocabularyById.get(id);

export const getVocabularyByCategory = (category: ScenarioCategory): VocabularyItem[] =>
  vocabulary.filter((item) => item.category === category);

export const getVocabularyByLevel = (level: CEFRLevel): VocabularyItem[] =>
  vocabulary.filter((item) => item.level === level);

export const searchVocabulary = (query: string): VocabularyItem[] => {
  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  if (!normalized) return vocabulary;
  return vocabulary.filter(
    (item) =>
      item.term.toLocaleLowerCase("en-US").includes(normalized) ||
      item.meaningTr.toLocaleLowerCase("tr-TR").includes(normalized),
  );
};
