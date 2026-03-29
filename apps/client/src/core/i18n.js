const LANG_STORAGE_KEY = "riffle_lang";

/** @type {Record<string, Record<string, unknown>>} */
const DICT = {
  en: {
    header: {
      login: "Login",
      signup: "Sign Up",
      leaderboard: "Leaderboard",
    },
    auth: {
      tabLogin: "LOGIN",
      tabRegister: "REGISTER",
      submitLogin: "ENTER THE ARENA",
      submitRegister: "CREATE LEGEND",
      processing: "Processing...",
      emailOrUsername: "Email or Username",
      password: "Password",
      loginIdentifierPh: "Enter your username",
      regUsername: "Username",
      regEmail: "Email",
      regUsernamePh: "Choose a rockstar name",
      regEmailPh: "Valid email address",
      regPasswordPh: "Make it strong",
    },
    profile: {
      title: "Profile",
      desc: "Choose your avatar",
      logout: "Log out",
      usernameLabel: "Username",
      usernameSave: "Save",
      languageLabel: "Language",
      favoriteSongs: "Favorite songs",
      favoritesEmpty: "You have no favorite songs yet.",
      favoritesTitle: "Favorite songs",
      usernameGuestHint: "You need to log in first to edit your username.",
    },
    preferences: {
      title: "App preferences",
      sub: "These apply on this device. Your account and avatar stay in Profile.",
      language: "Language",
      musicVolume: "Music preview volume",
      musicVolumeHint: "Used during in-game song previews.",
      reducedMotion: "Reduce motion",
      reducedMotionHint: "Less animation on the home screen.",
      largeTap: "Larger touch targets",
      largeTapHint: "Bigger buttons and cards on this menu.",
    },
    leaderboard: {
      title: "Leaderboard",
      desc: "Top scores per game mode (registered players)",
      modeLabel: "Mode",
      emptyMode: "No scores yet for this mode.",
      modes: {
        solo: "Marathon (solo)",
        versus: "Solo VS",
        team: "Team VS",
        coop: "Co-op",
        custom: "Custom",
        chaos: "Chaos",
      },
    },
    leaderboardUi: {
      pts: "pts",
      emptyMode: "No scores yet for this mode.",
      loadError: "Could not load leaderboard.",
      loadErrorShort: "Failed to load",
    },
    categories: {
      guestAvatarTitle: "Choose your avatar",
      guestAvatarSub: "Pick a look for this session.",
      guestAvatarContinue: "Continue",
    },
    mainLeaderboard: {
      title: "Leaderboard Preview",
      desc: "Top 3 scores for selected mode.",
      empty: "No scores yet for this mode.",
    },
    main: {
      brandBy: "by",
      desktopCta: "Join us!",
      heroSub: "Guess the song. Beat your friends. Climb the leaderboard.",
      menuPlayTitle: "Play",
      menuPlayDesc: "Pick a mode, choose categories, and jump in.",
      menuLbTitle: "Leaderboard",
      menuLbDesc: "See top players and compare mode scores.",
      menuSettingsTitle: "Settings",
      menuSettingsDesc: "Language, sound, accessibility, and comfort on this device.",
      menuAboutTitle: "About",
      menuAboutDesc: "Credits, quick info, and support links.",
      newsEyebrow: "News / Update Notes",
      newsTitle: "Fresh lobby fixes",
      newsText: "Chat, room code UI, and the lobby player list are getting smoother.",
      newsLearnMore: "Learn more",
      whatEyebrow: "What is Riffle?",
      whatTitle: "Fast music trivia for rock & metal fans.",
      whatText:
        "10-second previews, instant choices, pure adrenaline. Jump in, trust your ears, climb your score.",
      howEyebrow: "How to play",
      howTitle: "3 quick steps",
      howText: "Pick a mode, choose categories, hit Start and guess before time runs out.",
      gplayEyebrow: "Google Play",
      gplayTitle: "Get the app",
      gplayText: "Install Riffle on Android for faster sessions.",
      supportEyebrow: "Support",
      supportTitle: "Buy Me a Coffee",
      supportText: "If you enjoy Riffle, your support helps us ship more modes and features.",
      donate: "Donate",
      learnMoreTitle: "About Riffle",
      learnMoreBack: "Main Menu",
      supportCardTitle: "Buy Me a Coffee",
      supportCardText: "If you enjoy Riffle, your support helps us ship more modes and features.",
      deezerEyebrow: "Deezer",
      deezerTitle: "Thanks for the music",
      deezerText:
        "A big shout-out to Deezer. Explore music, discover new tracks, and keep the energy high.",
      openDeezer: "Open Deezer",
      discordEyebrow: "Discord",
      discordTitle: "Join our community",
      discordText: "Say hi, compete in events, and stay updated on new modes.",
      joinDiscord: "Join Discord",
      desktopAboutTitle: "About Riffle",
      desktopAboutDesc: "Thanks for playing. Here’s where music and community meet.",
    },
    playMode: {
      title: "Choose game mode",
      desc: "Pick your vibe and continue to category setup.",
      closeAria: "Close mode picker",
      marathonTitle: "Marathon Mode",
      marathonDesc: "Endless run. One life, checkpoint boosts every 10 questions.",
      versusTitle: "Solo VS Mode",
      versusDesc: "Fast duel format with short rounds and instant scoring.",
      teamTitle: "Team VS Mode",
      teamDesc: "Split into teams and race for the highest total score.",
      coopTitle: "Co-op Mode",
      coopDesc: "Play together, keep the streak alive, and climb as one.",
    },
    friends: {
      title: "Friends",
      desc: "Find people, accept requests, see who is online.",
      tabFind: "Find people",
      tabFriends: "My friends",
      tabRequests: "Requests",
      searchLabel: "Search by username",
      searchPlaceholder: "At least 2 characters",
      online: "Online",
      offline: "Offline",
    },
    social: {
      guestPrompt: "You need to log in first.",
      friendsTitle: "Friends",
      notificationsTitle: "Notifications",
      profileAria: "Profile",
    },
    notifications: {
      listHead: "Notifications",
      markAllRead: "Mark all read",
      empty: "No notifications yet.",
      someone: "Someone",
      friendRequest: "{name} sent a friend request",
      friendAccepted: "{name} accepted your friend request",
      roomInvite: "{name} invited you to a lobby",
      generic: "Notification",
      accept: "Accept",
      joinLobby: "Join lobby",
      toastFriends: "You are now friends",
      toastCouldNotAccept: "Could not accept",
      toastNew: "You have new notifications",
      toastUpdateFailed: "Could not update notifications",
    },
    friendsUi: {
      emptyOnline: "No friends online right now.",
      emptyOffline: "No offline friends listed.",
      loadError: "Could not load",
      noPendingRequests: "No pending requests.",
      accept: "Accept",
      decline: "Decline",
      friendAdded: "Friend added",
      failed: "Failed",
      searching: "Searching…",
      noUsersFound: "No users found.",
      tagFriends: "Friends",
      tagRequestSent: "Request sent",
      tagWantsFriends: "Wants to be friends",
      add: "Add",
      toastNowFriends: "You are now friends",
      toastRequestSent: "Friend request sent",
      couldNotSend: "Could not send",
      searchFailed: "Search failed",
    },
    categoriesPage: {
      tabSettings: "Settings",
      mainMenu: "Main Menu",
      mobileBackAria: "Go back",
      gameSettings: "Game Settings",
      numQuestions: "Number of Questions",
      roundOpt5: "5 Questions",
      roundOpt10: "10 Questions",
      roundOpt15: "15 Questions",
      roundOpt20: "20 Questions",
      marathonBadge: "Marathon Mode",
      unlimitedDisplay: "∞ Unlimited Questions",
      lives: "Lives",
      livesMarathonHint: "One Life Mode · +1 life every 10 questions",
      questionMode: "Question Mode",
      questionModeRandom: "Always random (Song / Artist / Album)",
      answerTime: "Answer Time",
      timeOpt10: "10 s — Hard",
      timeOpt15: "15 s — Normal",
      timeOpt20: "20 s — Easy",
      answerVisibility: "Answer Visibility",
      visRealtime: "Show answers in real-time",
      visRoundEnd: "Reveal at round end",
      coopTeamSize: "Co-op team size",
      coopTeamAria: "Co-op team size max 5",
      coopOpt1: "1 player",
      coopOpt2: "2 players",
      coopOpt3: "3 players",
      coopOpt4: "4 players",
      coopOpt5: "5 players (max)",
      teamVsPerSide: "Team VS — players per side",
      teamVsAria: "Players per team up to 5",
      musicCategories: "Music Categories",
      filterAll: "All",
      filterRock: "Rock",
      filterMetal: "Metal",
      filterMixed: "Mixed",
      filterTurkish: "Turkish",
      filterArtist: "Artist",
      eraAll: "All Eras",
      eraClassic: "Classic",
      searchArtistsLabel: "Search artists",
      searchArtistsPh: "Search artist or band name…",
      scrollLeft: "Scroll left",
      scrollRight: "Scroll right",
      emptyCategoriesFilter:
        "No categories found for this filter combo. Try another Type or Era.",
      emptyArtistSearch:
        "No artists match your search. Try different keywords or clear the search.",
      selectAllInView: "Select all in view",
      selectAllReady: "All visible categories are selected",
      selectAllNoMatches: "No categories match this filter",
      selectAllHint: "{type} · {era} · {n} categories",
      selectAllTypeAll: "All styles",
      clearSelection: "Clear selection",
      clearSelectionNone: "Nothing to clear",
      startGame: "Start Game",
      startHint: "Select at least one category to start",
      startHintShort: "Select at least one category",
      createGame: "Create Game",
      searchGame: "Search Game",
      yourSelections: "Your Selections",
      summaryMode: "Mode",
      summaryCategories: "Categories",
      noCategoriesSelected: "No categories selected",
      summaryNQuestions: "{n} Questions",
      summaryUnlimited: "Unlimited Questions",
      summaryUnlimitedCp: "Unlimited Questions (Checkpoint every 10)",
      summarySecondsPerAnswer: "{n} seconds per answer",
      summaryRandomMixed: "Random (Song / Artist / Album)",
      summaryOneLife: "One Life Mode · +1 life every 10 questions",
      heroMarathonTitle: "Marathon Mode",
      heroMarathonSub: "Endless run - one life, checkpoint boosts every 10 questions.",
      heroCoopTitle: "Co-op Mode",
      heroCoopSub: "Play together and keep the team streak alive.",
      heroVersusTitle: "Solo VS Mode",
      heroVersusSub: "Fast duel format with quick rounds and instant scoring.",
      heroTeamTitle: "Team VS Mode",
      heroTeamSub: "Two teams, short timers, tactical answer reveals.",
      selectionModeMarathon: "Marathon Mode",
      selectionModeCoop: "Co-op Mode",
      selectionModeVersus: "Solo VS Mode",
      selectionModeTeam: "Team VS Mode",
      selectionModeChaos: "Chaos Mode",
      selectionModeCustom: "Custom Mode",
      visVisible: "Answers Visible to All",
      visHidden: "Answers Hidden Until Round End",
      visIndividual: "Answers Only Visible to Answerer",
      quickBannerVersus: "Solo VS: 10 questions · 15s · live answers",
      quickBannerCoop: "Co-op: 12 questions · 20s · collaborate and climb",
      quickBannerTeam: "Team VS: 15 questions · 12s · answers revealed at round end",
      mobileStylePrefix: "Style:",
      mobileEraPrefix: "Era:",
      mobileStyleFallback: "Style",
      mobileEraFallback: "Era",
      sheetMusicStyle: "Music style",
      sheetEraTitle: "Era",
      sheetCloseAria: "Close",
      selectPlaceholder: "Select",
      lobbyStartHint: "Select categories and wait for players",
      alertInviteCopied: "Invite link copied!",
      alertSelectCategory: "Please select at least one category!",
      alertCopyShort: "Copied!",
      matchSearchTitle: "Searching game…",
      matchSearchCancelAria: "Cancel search",
      matchSearchBody: "Finding players with same mode and categories…",
      teamPickTitle: "Pick your team",
      teamPickCloseAria: "Close",
      teamPickBlue: "Join Blue",
      teamPickRed: "Join Red",
      playersTitle: "Players",
      backToSettings: "Back to Settings",
      youHost: "You • Host",
      waiting: "Waiting…",
      roomCode: "Room code",
      roomCodeShow: "Show room code",
      roomCodeHint: "Share this code or invite link with your friends.",
      inviteLink: "Invite link",
      shareLink: "Share link",
      copyLink: "Copy link",
      inviteOnlineFriends: "Invite online friends",
      inviteOnlineHint:
        "They get a notification with your lobby link. Online means logged in recently (about 2 minutes).",
      arenaTeams: "Arena Teams",
      blueTeam: "Blue Team",
      redTeam: "Red Team",
      waitingArea: "Waiting Area",
      arenaTapHint: "Tap left/right arena to join a team.",
      lobbyChat: "Lobby Chat",
      systemLabel: "System",
      lobbySystemMsg: "Lobby is live. Invite players and chat here.",
      chatPlaceholder: "Type a message…",
      matchmakerLabel: "Matchmaker",
    },
    aria: {
      closeAuth: "Close sign in",
      closeSettings: "Close settings",
      closeProfile: "Close profile",
      closeFriends: "Close friends",
      closeFavorites: "Close favorites panel",
      closeLeaderboard: "Close leaderboard",
      closeLearnMore: "Close learn more panel",
      closeAbout: "Close about",
      notifRegion: "Notification list",
    },
  },
  tr: {
    header: {
      login: "Giriş",
      signup: "Kayıt Ol",
      leaderboard: "Lider Tablosu",
    },
    auth: {
      tabLogin: "GİRİŞ",
      tabRegister: "KAYIT",
      submitLogin: "ARENA'YA GİR",
      submitRegister: "EFSANE OL",
      processing: "İşleniyor...",
      emailOrUsername: "E-posta veya kullanıcı adı",
      password: "Şifre",
      loginIdentifierPh: "Kullanıcı adınızı girin",
      regUsername: "Kullanıcı adı",
      regEmail: "E-posta",
      regUsernamePh: "Rockstar bir isim seç",
      regEmailPh: "Geçerli bir e-posta",
      regPasswordPh: "Güçlü bir şifre",
    },
    profile: {
      title: "Profil",
      desc: "Avatarını seç",
      logout: "Çıkış Yap",
      usernameLabel: "Kullanıcı Adı",
      usernameSave: "Kaydet",
      languageLabel: "Dil",
      favoriteSongs: "Favori şarkılar",
      favoritesEmpty: "Henüz favori şarkın yok.",
      favoritesTitle: "Favori şarkılar",
      usernameGuestHint: "Kullanıcı adını düzenlemek için önce giriş yapmalısın.",
    },
    preferences: {
      title: "Uygulama tercihleri",
      sub: "Bunlar bu cihaz için geçerli. Hesap ve avatarın Profil’de kalır.",
      language: "Dil",
      musicVolume: "Müzik önizleme sesi",
      musicVolumeHint: "Oyunda şarkı önizlemelerinde kullanılır.",
      reducedMotion: "Hareketi azalt",
      reducedMotionHint: "Ana sayfada daha az animasyon.",
      largeTap: "Daha büyük dokunma alanları",
      largeTapHint: "Bu menüde daha büyük düğmeler ve kartlar.",
    },
    leaderboard: {
      title: "Lider Tablosu",
      desc: "Oyun modlarına göre en iyi skorlar (kayıtlı oyuncular)",
      modeLabel: "Mod",
      emptyMode: "Bu mod için henüz skor yok.",
      modes: {
        solo: "Maraton (tek kişi)",
        versus: "Solo VS",
        team: "Takım VS",
        coop: "Ko-op",
        custom: "Özel",
        chaos: "Kaos",
      },
    },
    leaderboardUi: {
      pts: "puan",
      emptyMode: "Bu mod için henüz skor yok.",
      loadError: "Lider tablosu yüklenemedi.",
      loadErrorShort: "Yükleme başarısız",
    },
    categories: {
      guestAvatarTitle: "Avatarını seç",
      guestAvatarSub: "Bu oturum için bir görünüm seç.",
      guestAvatarContinue: "Devam",
    },
    mainLeaderboard: {
      title: "Lider Tablosu Önizleme",
      desc: "Seçilen moda göre ilk 3 skor.",
      empty: "Bu mod için henüz skor yok.",
    },
    main: {
      brandBy: "",
      desktopCta: "Bize katıl!",
      heroSub: "Şarkıyı tahmin et. Arkadaşlarını geç. Lider tablosuna tırman.",
      menuPlayTitle: "Oyna",
      menuPlayDesc: "Mod seç, kategorileri belirle ve başla.",
      menuLbTitle: "Lider Tablosu",
      menuLbDesc: "En iyi oyuncuları gör ve mod skorlarını karşılaştır.",
      menuSettingsTitle: "Ayarlar",
      menuSettingsDesc: "Dil, ses, erişilebilirlik ve bu cihazdaki konfor.",
      menuAboutTitle: "Hakkında",
      menuAboutDesc: "Krediler, kısa bilgi ve destek bağlantıları.",
      newsEyebrow: "Haber / Güncelleme notları",
      newsTitle: "Lobi düzeltmeleri",
      newsText: "Sohbet, oda kodu arayüzü ve lobi oyuncu listesi daha akıcı hale geliyor.",
      newsLearnMore: "Daha fazla bilgi",
      whatEyebrow: "Riffle nedir?",
      whatTitle: "Rock ve metal dinleyicileri için hızlı müzik trivia.",
      whatText:
        "10 saniyelik önizlemeler, anında seçimler, saf adrenalin. Dal, kulağını güven, skorunu yükselt.",
      howEyebrow: "Nasıl oynanır",
      howTitle: "3 hızlı adım",
      howText: "Mod seç, kategorileri işaretle, Başlat’a bas ve süre dolmadan tahmin et.",
      gplayEyebrow: "Google Play",
      gplayTitle: "Uygulamayı indir",
      gplayText: "Daha hızlı oturumlar için Riffle’ı Android’e yükle.",
      supportEyebrow: "Destek",
      supportTitle: "Buy Me a Coffee",
      supportText: "Riffle’ı seviyorsan desteğin yeni modlar ve özellikler için bize yardım eder.",
      donate: "Bağış yap",
      learnMoreTitle: "Riffle hakkında",
      learnMoreBack: "Ana menü",
      supportCardTitle: "Buy Me a Coffee",
      supportCardText: "Riffle’ı seviyorsan desteğin yeni modlar ve özellikler için bize yardım eder.",
      deezerEyebrow: "Deezer",
      deezerTitle: "Müzik için teşekkürler",
      deezerText:
        "Deezer’a kocaman bir teşekkür. Müziği keşfet, yeni parçalar bul, enerjiyi yüksek tut.",
      openDeezer: "Deezer’ı aç",
      discordEyebrow: "Discord",
      discordTitle: "Topluluğumuza katıl",
      discordText: "Merhaba de, etkinliklerde yarış, yeni modlardan haberdar ol.",
      joinDiscord: "Discord’a katıl",
      desktopAboutTitle: "Riffle hakkında",
      desktopAboutDesc: "Oynadığın için teşekkürler. Müzik ve topluluğun buluştuğu yer burası.",
    },
    playMode: {
      title: "Oyun modunu seç",
      desc: "Tarzını seç ve kategori kurulumuna devam et.",
      closeAria: "Mod seçiciyi kapat",
      marathonTitle: "Maraton modu",
      marathonDesc: "Sonsuz koşu. Tek can, her 10 soruda kontrol noktası.",
      versusTitle: "Solo VS modu",
      versusDesc: "Kısa turlar ve anında skorlama ile hızlı düello.",
      teamTitle: "Takım VS modu",
      teamDesc: "Takımlara bölün ve en yüksek toplam skor için yarışın.",
      coopTitle: "Ko-op modu",
      coopDesc: "Birlikte oyna, seriyi koru, birlikte yüksel.",
    },
    friends: {
      title: "Arkadaşlar",
      desc: "İnsanları bul, istekleri kabul et, kimlerin çevrimiçi olduğunu gör.",
      tabFind: "İnsan bul",
      tabFriends: "Arkadaşlarım",
      tabRequests: "İstekler",
      searchLabel: "Kullanıcı adına göre ara",
      searchPlaceholder: "En az 2 karakter",
      online: "Çevrimiçi",
      offline: "Çevrimdışı",
    },
    social: {
      guestPrompt: "Önce giriş yapmalısın.",
      friendsTitle: "Arkadaşlar",
      notificationsTitle: "Bildirimler",
      profileAria: "Profil",
    },
    notifications: {
      listHead: "Bildirimler",
      markAllRead: "Tümünü okundu işaretle",
      empty: "Henüz bildirim yok.",
      someone: "Birisi",
      friendRequest: "{name} arkadaşlık isteği gönderdi",
      friendAccepted: "{name} arkadaşlık isteğini kabul etti",
      roomInvite: "{name} seni lobiye davet etti",
      generic: "Bildirim",
      accept: "Kabul et",
      joinLobby: "Lobiye katıl",
      toastFriends: "Artık arkadaşsınız",
      toastCouldNotAccept: "Kabul edilemedi",
      toastNew: "Yeni bildirimlerin var",
      toastUpdateFailed: "Bildirimler güncellenemedi",
    },
    friendsUi: {
      emptyOnline: "Şu an çevrimiçi arkadaşın yok.",
      emptyOffline: "Çevrimdışı arkadaş listelenmiyor.",
      loadError: "Yüklenemedi",
      noPendingRequests: "Bekleyen istek yok.",
      accept: "Kabul et",
      decline: "Reddet",
      friendAdded: "Arkadaş eklendi",
      failed: "Başarısız",
      searching: "Aranıyor…",
      noUsersFound: "Kullanıcı bulunamadı.",
      tagFriends: "Arkadaş",
      tagRequestSent: "İstek gönderildi",
      tagWantsFriends: "Arkadaş olmak istiyor",
      add: "Ekle",
      toastNowFriends: "Artık arkadaşsınız",
      toastRequestSent: "Arkadaşlık isteği gönderildi",
      couldNotSend: "Gönderilemedi",
      searchFailed: "Arama başarısız",
    },
    categoriesPage: {
      tabSettings: "Ayarlar",
      mainMenu: "Ana menü",
      mobileBackAria: "Geri",
      gameSettings: "Oyun ayarları",
      numQuestions: "Soru sayısı",
      roundOpt5: "5 soru",
      roundOpt10: "10 soru",
      roundOpt15: "15 soru",
      roundOpt20: "20 soru",
      marathonBadge: "Maraton modu",
      unlimitedDisplay: "∞ Sınırsız soru",
      lives: "Can",
      livesMarathonHint: "Tek can modu · Her 10 soruda +1 can",
      questionMode: "Soru modu",
      questionModeRandom: "Her zaman rastgele (Şarkı / Sanatçı / Albüm)",
      answerTime: "Cevap süresi",
      timeOpt10: "10 sn — Zor",
      timeOpt15: "15 sn — Normal",
      timeOpt20: "20 sn — Kolay",
      answerVisibility: "Cevap görünürlüğü",
      visRealtime: "Cevapları anında göster",
      visRoundEnd: "Tur sonunda göster",
      coopTeamSize: "Ko-op takım boyutu",
      coopTeamAria: "Ko-op takım boyutu en fazla 5",
      coopOpt1: "1 oyuncu",
      coopOpt2: "2 oyuncu",
      coopOpt3: "3 oyuncu",
      coopOpt4: "4 oyuncu",
      coopOpt5: "5 oyuncu (en fazla)",
      teamVsPerSide: "Takım VS — taraftaki oyuncu sayısı",
      teamVsAria: "Takım başına en fazla 5 oyuncu",
      musicCategories: "Müzik kategorileri",
      filterAll: "Tümü",
      filterRock: "Rock",
      filterMetal: "Metal",
      filterMixed: "Karışık",
      filterTurkish: "Türkçe",
      filterArtist: "Sanatçı",
      eraAll: "Tüm dönemler",
      eraClassic: "Klasik",
      searchArtistsLabel: "Sanatçı ara",
      searchArtistsPh: "Sanatçı veya grup adı…",
      scrollLeft: "Sola kaydır",
      scrollRight: "Sağa kaydır",
      emptyCategoriesFilter:
        "Bu filtreyle eşleşen kategori yok. Tür veya dönemi değiştir.",
      emptyArtistSearch:
        "Aramanla eşleşen sanatçı yok. Farklı kelimeler dene veya aramayı temizle.",
      selectAllInView: "Görünenlerin tümünü seç",
      selectAllReady: "Görünenlerin tümü seçili",
      selectAllNoMatches: "Bu filtreyle eşleşen kategori yok",
      selectAllHint: "{type} · {era} · {n} kategori",
      selectAllTypeAll: "Tüm türler",
      clearSelection: "Seçimi temizle",
      clearSelectionNone: "Temizlenecek seçim yok",
      startGame: "Oyuna başla",
      startHint: "Başlamak için en az bir kategori seç",
      startHintShort: "En az bir kategori seç",
      createGame: "Oyun oluştur",
      searchGame: "Oyun ara",
      yourSelections: "Seçimlerin",
      summaryMode: "Mod",
      summaryCategories: "Kategoriler",
      noCategoriesSelected: "Kategori seçilmedi",
      summaryNQuestions: "{n} soru",
      summaryUnlimited: "Sınırsız soru",
      summaryUnlimitedCp: "Sınırsız soru (Her 10’da kontrol)",
      summarySecondsPerAnswer: "Cevap başına {n} saniye",
      summaryRandomMixed: "Rastgele (Şarkı / Sanatçı / Albüm)",
      summaryOneLife: "Tek can modu · Her 10 soruda +1 can",
      heroMarathonTitle: "Maraton modu",
      heroMarathonSub: "Sonsuz koşu — tek can, her 10 soruda kontrol noktası.",
      heroCoopTitle: "Ko-op modu",
      heroCoopSub: "Birlikte oyna, takım serisini koru.",
      heroVersusTitle: "Solo VS modu",
      heroVersusSub: "Hızlı turlar ve anında skorlama ile düello.",
      heroTeamTitle: "Takım VS modu",
      heroTeamSub: "İki takım, kısa süreler, taktiksel cevap gösterimi.",
      selectionModeMarathon: "Maraton modu",
      selectionModeCoop: "Ko-op modu",
      selectionModeVersus: "Solo VS modu",
      selectionModeTeam: "Takım VS modu",
      selectionModeChaos: "Kaos modu",
      selectionModeCustom: "Özel mod",
      visVisible: "Cevaplar herkese görünür",
      visHidden: "Tur bitene kadar gizli",
      visIndividual: "Cevaplar yalnızca cevaplayana görünür",
      quickBannerVersus: "Solo VS: 10 soru · 15 sn · canlı cevaplar",
      quickBannerCoop: "Ko-op: 12 soru · 20 sn · iş birliğiyle yüksel",
      quickBannerTeam: "Takım VS: 15 soru · 12 sn · cevaplar tur sonunda",
      mobileStylePrefix: "Tür:",
      mobileEraPrefix: "Dönem:",
      mobileStyleFallback: "Tür",
      mobileEraFallback: "Dönem",
      sheetMusicStyle: "Müzik türü",
      sheetEraTitle: "Dönem",
      sheetCloseAria: "Kapat",
      selectPlaceholder: "Seç",
      lobbyStartHint: "Kategori seç ve oyuncuları bekle",
      alertInviteCopied: "Davet bağlantısı kopyalandı!",
      alertSelectCategory: "Lütfen en az bir kategori seç!",
      alertCopyShort: "Kopyalandı!",
      matchSearchTitle: "Oyun aranıyor…",
      matchSearchCancelAria: "Aramayı iptal et",
      matchSearchBody: "Aynı mod ve kategorilerle oyuncular aranıyor…",
      teamPickTitle: "Takımını seç",
      teamPickCloseAria: "Kapat",
      teamPickBlue: "Mavi takıma katıl",
      teamPickRed: "Kırmızı takıma katıl",
      playersTitle: "Oyuncular",
      backToSettings: "Ayarlara dön",
      youHost: "Sen • Ev sahibi",
      waiting: "Bekleniyor…",
      roomCode: "Oda kodu",
      roomCodeShow: "Oda kodunu göster",
      roomCodeHint: "Bu kodu veya davet bağlantısını arkadaşlarınla paylaş.",
      inviteLink: "Davet bağlantısı",
      shareLink: "Bağlantıyı paylaş",
      copyLink: "Kopyala",
      inviteOnlineFriends: "Çevrimiçi arkadaşları davet et",
      inviteOnlineHint:
        "Lobi bağlantınla bildirim gider. Çevrimiçi: yakın zamanda giriş yapmış (yaklaşık 2 dakika).",
      arenaTeams: "Arena takımları",
      blueTeam: "Mavi takım",
      redTeam: "Kırmızı takım",
      waitingArea: "Bekleme alanı",
      arenaTapHint: "Takıma katılmak için sol/sağ arenaya dokun.",
      lobbyChat: "Lobi sohbeti",
      systemLabel: "Sistem",
      lobbySystemMsg: "Lobi açık. Oyuncuları davet et ve buradan yaz.",
      chatPlaceholder: "Mesaj yaz…",
      matchmakerLabel: "Eşleştirme",
    },
    aria: {
      closeAuth: "Girişi kapat",
      closeSettings: "Ayarları kapat",
      closeProfile: "Profili kapat",
      closeFriends: "Arkadaşları kapat",
      closeFavorites: "Favoriler panelini kapat",
      closeLeaderboard: "Lider tablosunu kapat",
      closeLearnMore: "Daha fazla bilgi panelini kapat",
      closeAbout: "Hakkında penceresini kapat",
      notifRegion: "Bildirim listesi",
    },
  },
};

export function getLang() {
  const raw = localStorage.getItem(LANG_STORAGE_KEY);
  if (!raw) return "en";
  if (raw !== "tr" && raw !== "en") return "en";
  return raw;
}

export function setLang(lang) {
  const next = lang === "tr" || lang === "en" ? lang : "en";
  localStorage.setItem(LANG_STORAGE_KEY, next);
  document.querySelectorAll("[data-riffle-lang-select]").forEach((el) => {
    if (el instanceof HTMLSelectElement) el.value = next;
  });
  applyIndexLanguage(next);
  applyGuestAvatarModalStrings(next);
  window.dispatchEvent(new CustomEvent("riffle-lang-changed", { detail: { lang: next } }));
  import("../social/social-nav-state.js")
    .then((m) => m.syncSocialNavAuthState?.())
    .catch(() => {});
}

export function t(path, lang = getLang()) {
  const parts = String(path).split(".");
  let cur = DICT[lang];
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return path;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : path;
}

/** Replace `{name}`-style placeholders in a translated string. */
export function tVar(path, vars = {}, lang = getLang()) {
  let s = t(path, lang);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

/**
 * Apply `[data-riffle-i18n="path.to.key"]` text and optional
 * `[data-riffle-i18n-attr="aria-label"]` on the same element.
 * Placeholders: `[data-riffle-i18n-placeholder="path"]` on inputs.
 */
export function applyDataRiffleI18n(root = document, lang = getLang()) {
  root.querySelectorAll("[data-riffle-i18n]").forEach((el) => {
    const key = el.getAttribute("data-riffle-i18n");
    if (!key) return;
    const text = t(key, lang);
    const attr = el.getAttribute("data-riffle-i18n-attr");
    if (attr) {
      el.setAttribute(attr, text);
    } else {
      el.textContent = text;
    }
  });
  root.querySelectorAll("[data-riffle-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-riffle-i18n-placeholder");
    if (!key || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    el.placeholder = t(key, lang);
  });
}

function applyLeaderboardModeSelects(lang = getLang()) {
  const applySel = (sel) => {
    if (!sel) return;
    sel.querySelectorAll("option").forEach((opt) => {
      const v = opt.value;
      const mapped = DICT[lang]?.leaderboard?.modes?.[v];
      if (typeof mapped === "string") opt.textContent = mapped;
    });
  };
  applySel(document.getElementById("leaderboard-mode"));
  applySel(document.getElementById("main-leaderboard-mode"));
}

export function applyIndexLanguage(lang = getLang()) {
  document.documentElement.setAttribute("lang", lang === "tr" ? "tr" : "en");
  applyDataRiffleI18n(document, lang);
  applyLeaderboardModeSelects(lang);

  const mainLeaderboard = document.getElementById("main-leaderboard-preview");
  if (mainLeaderboard) {
    setText(document.getElementById("main-leaderboard-title"), t("mainLeaderboard.title", lang));
    setText(document.getElementById("main-leaderboard-desc"), t("mainLeaderboard.desc", lang));
    setText(document.getElementById("main-leaderboard-empty"), t("mainLeaderboard.empty", lang));
  }
}

/** Guest avatar gate (categories.html); safe no-op on index. */
export function applyGuestAvatarModalStrings(lang = getLang()) {
  const title = document.getElementById("guest-avatar-title");
  const sub = document.querySelector(".guest-avatar-modal__sub");
  const cont = document.getElementById("guest-avatar-continue");
  setText(title, t("categories.guestAvatarTitle", lang));
  setText(sub, t("categories.guestAvatarSub", lang));
  setText(cont, t("categories.guestAvatarContinue", lang));
}

/** categories.html: `lang`, `[data-riffle-i18n]`, guest modal. */
export function applyCategoriesPageLanguage(lang = getLang()) {
  document.documentElement.setAttribute("lang", lang === "tr" ? "tr" : "en");
  applyDataRiffleI18n(document, lang);
  applyGuestAvatarModalStrings(lang);
}

/** @deprecated use applyGuestAvatarModalStrings */
export function applyCategoriesLanguage(lang = getLang()) {
  applyGuestAvatarModalStrings(lang);
}

export function initLanguageControl() {
  document.querySelectorAll("[data-riffle-lang-select]").forEach((sel) => {
    if (!(sel instanceof HTMLSelectElement)) return;
    sel.value = getLang();
    sel.addEventListener("change", () => {
      setLang(sel.value);
    });
  });
  applyIndexLanguage(getLang());
}
