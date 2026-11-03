import type { LegalTexts } from ".";

const tr: LegalTexts = {
  privacy: {
    title: "Gizlilik Politikası",
    intro:
      "Bu politika, Brezilya Genel Veri Koruma Kanunu'na (LGPD, 13.709/2018 sayılı Kanun) uygun olarak Orbi'nin hangi kişisel verileri topladığını, ne için kullandığını, kimlerle paylaştığını ve bunları nasıl kontrol edebileceğini açıklar. Orbi'yi kullanarak {terms} metnini de kabul etmiş olursun. Bu bir çeviridir; tereddüt hâlinde Portekizce sürüm geçerlidir.",
    sections: [
      {
        id: "who",
        title: "Verilerinden kim sorumlu",
        body: [
          "Orbi, Brezilya'da geliştirilen bağımsız bir projedir ve kişisel verilerinin veri sorumlusudur. Veri koruma görevlisi (DPO) dahil her türlü gizlilik konusu için {email} adresine yaz.",
        ],
      },
      {
        id: "collect",
        title: "Topladığımız veriler",
        body: ["Yalnızca Orbi'nin çalışması için gerekenleri topluyoruz:"],
        list: [
          "Hesap: e-posta, ad ve şifre (giriş sağlayıcımız tarafından şifrelenmiş olarak saklanır; Orbi'de kimse göremez). Google ile girersen Google'ın paylaştığı adı, e-postayı ve fotoğrafı alırız.",
          "Profil: kullanıcı adı, görünen ad, biyografi, konum, web sitesi ve zamirler (kullanıcı adı dışında hepsi isteğe bağlı), fotoğraf, kapak, çıkartma, favoriler, dil ve gizli profil ile yetişkin içerik gibi tercihler.",
          "Kaydettiklerin: durum, puanlar, beğeniler, incelemeler, tarihler, izlenen bölümler, listeler, yorumlar, inceleme ekleri, takip ettiğin kişiler, gönderdiğin şikâyetler ve kataloğa eklediğin eserler.",
          "Letterboxd içe aktarma: .zip dosyası yalnızca kayıtlarını getirmek için okunur; dosyanın kendisi saklanmaz.",
          "Cihazlar: tarayıcı ve sistem türü (örneğin \"Chrome · Windows\") ile ilk erişim tarihi; hesabın yeni bir cihazda oturum açtığında seni uyarmak için. Bu listede IP adresini saklamayız.",
          "Teknik veriler: barındırma ve veritabanı sağlayıcılarımız güvenlik ve hizmetin çalışması için IP adresi ile isteklerin tarih ve saati gibi verileri kaydeder.",
        ],
      },
      {
        id: "not-collect",
        title: "Toplamadıklarımız",
        body: [
          "Kimlik numarası, adres, telefon veya ödeme bilgisi istemeyiz, kesin konumunu kullanmayız ve hassas verileri (sağlık, din veya siyasi görüş gibi) bilerek işlemeyiz. Verilerini satmayız, reklam göstermeyiz ve üçüncü taraf takip veya analiz araçları kullanmayız.",
        ],
      },
      {
        id: "use",
        title: "Amaçlar ve hukuki dayanaklar",
        list: [
          "Hesabını oluşturmak ve sürdürmek, kaydettiklerini saklamak ve göstermek, hesap e-postalarını göndermek (doğrulama ve şifre sıfırlama) ve profilini başkalarına göstermek: sözleşmenin, yani bu koşulların ifası (LGPD, md. 7, V).",
          "Yeni cihaz uyarısı, kötüye kullanımın önlenmesi ve şikâyetlerin incelenmesi gibi güvenlik işlemleri: meşru menfaat (md. 7, IX) ve yasal yükümlülüklerin yerine getirilmesi (md. 7, II).",
          "Resmî makamların taleplerine yanıt vermek: yasal yükümlülük veya mahkeme kararının yerine getirilmesi.",
        ],
        body: [],
      },
      {
        id: "public",
        title: "Neler herkese açık",
        body: [
          "Profilin, kayıtların, puanların, incelemelerin, listelerin, yorumların, beğenilerin ve kimi takip ettiğin hesabı olmayanlar dahil herkes tarafından görülebilir. Profilini {settings} bölümünden gizlersen profilini ve etkinliklerini yalnızca sen görürsün. E-postan asla başkalarına gösterilmez.",
        ],
      },
      {
        id: "share",
        title: "Kimlerle paylaşıyoruz",
        body: ["Veri satmayız veya kiralamayız. Veriler yalnızca şunlardan geçer:"],
        list: [
          "Verileri bizim adımıza işleyen Supabase (veritabanı, giriş ve dosya depolama) ve Vercel (site barındırma).",
          "Google, yalnızca Google hesabınla girmeyi seçersen.",
          "TMDB, AniList, Open Library ve Steam: eserlerin görselleri ve bilgileri onların sunucularından yüklenir; başka yerde barındırılan görselleri gösteren her sitede olduğu gibi IP adresini alırlar.",
          "YouTube (youtube-nocookie.com): yalnızca bir fragmanı izlemek için tıkladığında.",
          "MyMemory: yalnızca bir incelemede Çevir'e tıkladığında; inceleme metni çeviri için gönderilir.",
          "Kanun veya mahkeme kararı gerektirdiğinde resmî makamlar.",
        ],
      },
      {
        id: "transfer",
        title: "Yurt dışına aktarım",
        body: [
          "Bu sağlayıcılardan bazıları verileri Brezilya dışındaki, örneğin ABD'deki sunucularda saklar. Bu aktarım, istediğin hizmeti sunmak için gereklidir (LGPD, md. 33) ve güvenlik önlemleri ile veri koruma hükümleri uygulayan sağlayıcılarla yapılır.",
        ],
      },
      {
        id: "retention",
        title: "Ne kadar süre saklıyoruz",
        body: [
          "Verilerini hesabın var olduğu sürece saklarız. Hesabını sildiğinde profil, kayıtlar, incelemeler, listeler, yorumlar, beğeniler, takipçiler, cihazlar, fotoğraflar ve ekler hemen silinir. Sağlayıcıların yedekleri bu verileri yenilenene kadar sınırlı bir süre tutabilir. Kataloğa eklediğin eserler seninle bağlantısı olmadan kullanılabilir kalır. Kanuna uymak veya hukuki süreçlerde kendimizi savunmak için gereken asgari verileri saklayabiliriz.",
        ],
      },
      {
        id: "rights",
        title: "Hakların",
        body: [
          "LGPD (md. 18) uyarınca şunları yapabilirsin: verilerini işleyip işlemediğimizi öğrenmek ve onlara erişmek; eksik veya yanlış verileri düzeltmek; gereksiz verilerin anonimleştirilmesini, engellenmesini veya silinmesini istemek; verilerinin bir kopyasını almak (taşınabilirlik); kimlerle paylaşıldığını öğrenmek; rızanı geri çekmek; ve kanuna aykırı işlemlere itiraz etmek.",
          "Neredeyse her şeyi {settings} bölümünden kendin yapabilirsin: profili düzenlemek, verilerinin bir kopyasını indirmek ve hesabını silmek. Diğer konular için {email} adresine yaz; 15 gün içinde yanıt veririz. Brezilya Ulusal Veri Koruma Kurumu'na (ANPD) da şikâyette bulunabilirsin.",
        ],
      },
      {
        id: "minors",
        title: "Çocuklar ve gençler",
        body: [
          "Orbi 13 yaş ve üzeri içindir. 13 ile 17 yaş arasındakiler ebeveyn veya vasi izni almalıdır. Bir hesabın 13 yaşından küçük birine ait olduğunu öğrenirsek hesap silinir. Ebeveynler ve vasiler {email} adresinden silme talep edebilir.",
        ],
      },
      {
        id: "security",
        title: "Güvenlik",
        body: [
          "Şifreli bağlantı (HTTPS), şifrelenmiş olarak saklanan parolalar ve herkesin yalnızca kendine ait olanı değiştirebilmesi için veritabanında erişim kuralları kullanırız. Hiçbir sistem tamamen güvenli değildir; önemli bir risk veya zarara yol açabilecek bir olay olursa seni ve ANPD'yi bilgilendiririz.",
        ],
      },
      {
        id: "cookies",
        title: "Çerezler",
        body: ["Yalnızca sitenin çalışması ve tercihlerini hatırlaması için gerekli çerezleri kullanırız. Ayrıntılar {cookies} metninde."],
      },
      {
        id: "changes",
        title: "Bu politikadaki değişiklikler",
        body: [
          "Bu politikayı güncelleyebiliriz. Geçerli sürümün tarihi sayfanın üstündedir ve önemli değişiklikleri yürürlüğe girmeden önce sitede duyururuz.",
        ],
      },
    ],
  },
  terms: {
    title: "Kullanım Koşulları",
    intro:
      "Bu koşullar seninle Orbi arasındaki sözleşmedir. Hesap oluşturarak veya siteyi kullanarak bu koşulları ve {privacy} metnini kabul edersin. Kabul etmiyorsan Orbi'yi kullanma. Bu bir çeviridir; tereddüt hâlinde Portekizce sürüm geçerlidir.",
    sections: [
      {
        id: "service",
        title: "Orbi nedir",
        body: [
          "Orbi, izlediklerini, okuduklarını ve oynadıklarını kaydedip paylaşman için ücretsiz ve bağımsız bir hizmettir. Geliştirme aşamasındadır: özellikler değişebilir, durdurulabilir veya kaldırılabilir ve site zaman zaman erişilemez olabilir.",
        ],
      },
      {
        id: "account",
        title: "Hesabın",
        list: [
          "13 yaşında veya daha büyük olmalısın. 13 ile 17 yaş arasında yalnızca, kullanımdan da sorumlu olan ebeveyn veya vasinin izniyle.",
          "Doğru bilgiler kullan ve şifreni gizli tut. Hesabınla yapılan her şeyden sen sorumlusun.",
          "Kullanıcı adın başka bir kişiyi, markayı veya şirketi taklit edemez ve saldırgan olamaz.",
        ],
        body: [],
      },
      {
        id: "content",
        title: "İçeriğin",
        body: [
          "Yayımladığın incelemeler, puanlar, listeler, yorumlar ve görseller sana ait olmaya devam eder. Yayımlayarak Orbi'ye bu içeriği yayında kaldığı sürece Orbi içinde saklamak, göstermek, biçimini uyarlamak (örneğin küçük resim oluşturmak veya istendiğinde çevirmek) ve sunmak için ücretsiz, dünya çapında ve münhasır olmayan bir lisans verirsin.",
          "Gönderdiğin şeyi yayımlama hakkına sahip olduğunu garanti edersin. Kataloğa eklediğin eserler, hesabını sildikten sonra da herkes için kullanılabilir kalır.",
        ],
      },
      {
        id: "rules",
        title: "İzin verilmeyenler",
        list: [
          "Yasa dışı içerik, nefret söylemi, taciz, tehdit veya şiddete teşvik yayımlamak.",
          "Çıplaklık veya müstehcen cinsel içerik yayımlamak; çocukları içeren her türlü cinsel içerik kaldırılır ve yetkililere bildirilir.",
          "Başkalarının kişisel verilerini ifşa etmek veya başkası gibi davranmak.",
          "Korsan içerik veya bağlantılarını yüklemek ya da hakkın olmayan görsel ve metinleri kullanmak.",
          "Sahte inceleme yazmak veya sahte hesaplar ya da otomasyonla puanları, beğenileri ve takipçileri manipüle etmek.",
          "Spam veya toplu reklam yapmak.",
          "Siteye sızmaya, aşırı yük bindirmeye veya toplu kopyalamaya çalışmak ya da sınırları ve erişim kurallarını aşmak.",
        ],
        body: [],
      },
      {
        id: "moderation",
        title: "Şikâyetler ve moderasyon",
        body: [
          "İncelemelerin, yorumların ve listelerin menüsündeki Şikâyet Et düğmesini kullan; profiller için {email} adresine yaz. Bu koşulları veya kanunu ihlal eden içerikleri kaldırabilir, hesapları askıya alabilir veya silebiliriz; mümkün olduğunda nedenini bildiririz.",
        ],
      },
      {
        id: "copyright",
        title: "Telif hakları ve kaldırma talepleri",
        body: [
          "Orbi'deki bir içerik haklarını ihlal ediyorsa (görseller dahil), içeriğin bağlantısı, gerekçe ve iletişim bilgisiyle {email} adresine yaz. Tüm talepleri inceler ve haklı olanları kaldırırız.",
        ],
      },
      {
        id: "third-party",
        title: "Üçüncü taraf içerikleri",
        body: [
          "Eserlerin adları, özetleri, afişleri, kapakları ve diğer verileri TMDB, AniList, Open Library ve Steam'den gelir ve hak sahiplerine aittir; yalnızca eserleri tanımlamak için kullanılır. Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır. Orbi bu hizmetlerin hiçbiriyle ve Letterboxd ile bağlantılı değildir.",
          "Puanlar ve incelemeler yazarlarının görüşleridir, Orbi'nin değil. Bağlantı verilen dış sitelerin içeriğinden sorumlu değiliz.",
        ],
      },
      {
        id: "warranty",
        title: "Garantiler ve sorumluluk",
        body: [
          "Orbi olduğu gibi sunulur; her zaman erişilebilir, hatasız veya eser bilgilerinin her zaman doğru olacağı garanti edilmez. Kanunun izin verdiği ölçüde veri kaybı, kesintiler veya kullanıcıların yayımladığı içerikten sorumlu değiliz. Verilerinin bir kopyasını zaman zaman {settings} bölümünden indirmeni öneririz. Buradaki hiçbir şey tüketici olarak sahip olduğun hakları sınırlamaz.",
        ],
      },
      {
        id: "end",
        title: "Sona erme",
        body: ["Hesabını istediğin zaman {settings} bölümünden silebilirsin. Bu koşulları veya kanunu ihlal eden hesapları kapatabiliriz."],
      },
      {
        id: "changes",
        title: "Bu koşullardaki değişiklikler",
        body: [
          "Bu koşulları güncelleyebiliriz. Geçerli sürümün tarihi sayfanın üstündedir ve önemli değişiklikleri yürürlüğe girmeden önce sitede duyururuz. Sonrasında Orbi'yi kullanmaya devam etmen yeni sürümü kabul ettiğin anlamına gelir.",
        ],
      },
      {
        id: "law",
        title: "Uygulanacak hukuk ve iletişim",
        body: ["Bu koşullar Brezilya hukukuna tabidir ve yerleşim yerindeki mahkemeler yetkilidir. Soru, öneri veya şikâyetler: {email}."],
      },
    ],
  },
  cookies: {
    title: "Çerez Politikası",
    intro:
      "Çerezler, bir sitenin tarayıcına kaydettiği küçük dosyalardır. Orbi yalnızca çalışması ve tercihlerini hatırlaması için gerekli çerezleri ve yerel depolamayı kullanır. Reklam, takip veya analiz çerezleri kullanmadığımız için onay istemeyiz.",
    sections: [
      {
        id: "cookies",
        title: "Kullandığımız çerezler",
        body: [],
        items: [
          ["sb-…-auth-token", "Oturumunu açık tutar (Supabase). Çıkış yapana veya oturum sona erene kadar geçerlidir."],
          ["orbi_locale", "Seçtiğin dil. 1 yıl."],
          ["orbi-device", "Hesabındaki \"yeni cihaz\" uyarısı için bu tarayıcıyı tanınmış olarak işaretler. 1 yıl."],
          ["orbi-notifications-seen, orbi-notif-read, orbi-notif-unread, orbi-notif-deleted, orbi-notif-gone", "Hangi bildirimleri gördüğünü, okundu veya okunmadı olarak işaretlediğini ve sildiğini hatırlar. 1 yıl."],
          ["orbi-welcome-seen", "Orbi karşılamasını zaten gördüğünü hatırlar. 1 yıl."],
        ],
      },
      {
        id: "storage",
        title: "Yerel depolama",
        body: ["Bazı ayarlar yalnızca tarayıcında kalır ve bize asla gönderilmez:"],
        items: [
          ["orbi-theme, orbi-theme-custom", "Seçtiğin tema ve renkler."],
          ["orbi-login", "E-postan veya kullanıcı adın; yalnızca girişte \"Beni hatırla\" seçeneğini işaretlersen."],
          ["orbi-nav-history", "Geri düğmesinin çalışması için bu sekmede açılan sayfalar. Sekmeyi kapatınca silinir."],
        ],
      },
      {
        id: "third-party",
        title: "Üçüncü taraf çerezleri",
        body: [
          "Orbi üçüncü taraf çerezi yerleştirmez. Bir fragmanı izlemek için tıklarsan video, Google'ın politikasına göre tarayıcıda veri saklayabilen gelişmiş gizlilik modundaki YouTube'dan (youtube-nocookie.com) gelir. Google ile girişte Google'ın giriş sayfası kendi çerezlerini kullanır.",
        ],
      },
      {
        id: "control",
        title: "Nasıl kontrol edilir",
        body: [
          "Çerezleri tarayıcı ayarlarından silebilir veya engelleyebilirsin, ancak oturum çerezi olmadan giriş yapamazsın. Çıkış yapmak oturum çerezini siler. Sorular: {email}. Ayrıca {privacy} metnine bak.",
        ],
      },
    ],
  },
};

export default tr;
