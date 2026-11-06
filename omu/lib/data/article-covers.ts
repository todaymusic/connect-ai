/**
 * 정보글 기본 대표 사진 — 사이트 코드에 같이 들어 있는 사진 (public/covers/…).
 * 관리자 화면에서 올린 대표 사진(articles.thumbnail_url)이 있으면 그쪽이 먼저 보인다.
 * 2026-11-06 Higgsfield(GPT Image 2)로 만든 사진.
 *  - 뮤직스토리·공연·공모전·입시·연습실: 글마다 한 장 (public/covers/<분류>/<slug>.jpg)
 *  - 악기 입문: 제목의 악기·주제로 묶음을 고르고 묶음 안 여러 장 중 하나 (public/covers/beginner/<묶음>-<n>.jpg)
 *    새 입문 글도 제목만으로 자동으로 사진이 붙는다.
 */
const COVER_SLUGS: Record<string, ReadonlySet<string>> = {
  story: new Set<string>([
    "hapju-cheot-nal-eosaekham-iyagi-cheoeum-mannan-saramdeulgwa-sorireul-mat",
    "yeonju-silsu-hu-maeum-chuseureuneun-iyagi-teulrin-dwie-dasi-ieoganeun-be",
    "sinieo-akgi-sijak-iyagi-neuteun-nai-cheot-eumeul-nureugikkajiui-maeum",
    "toegeun-hu-20bun-yeonseup-rutin-jjalado-kkujunhi-ssatineun-yeonseup-guse",
    "akgi-seulreompeu-jinaganeun-gwajeong-iyagi-jeongchegireul-daehaneun-beop",
    "mudae-ginjang-daruneun-yeonseup-iyagi-tteolrimgwa-hamkke-yeonjuhaneun-ba",
    "yeonju-yeongsang-chwalyeong-hwalyongbeop-yeongsangeuro-jeomgeomhago-seon",
    "akgi-yeonseup-donggi-yujihaneun-bangbeop-kkujunhameul-mandeuneun-jakeun",
    "yeonseupi-an-doel-ttae-dolaboneun-jilmun-7gaji-makhin-iyu-chatgi",
    "beoseuking-junbihamyeo-saenggakhae-bol-jeom-gok-seontaekbuteo-jangso-hwa",
    "yeonseupsil-daeyeoga-cheoeumiramyeon-yeyak-jeone-saenggakhae-bol-jilmund",
    "akgi-cheoeum-baeudeon-nal-neukkin-jeom-jeongri-cheot-sueopeseo-dolabol-j",
    "hapju-riheoseol-jeonnal-mueoteul-junbihalkka-jeomgeom-jilmun-moeum",
    "eumak-gamsang-seupgwani-yeonju-silryeoke-juneun-doum-deutneun-gwi-kiuneu",
    "gajokgwa-hamkke-akgi-baeuneun-jeulgeoum-pianoro-sijakhaneun-hyeonsil-gai",
    "akgireul-pogihago-sipeul-ttae-budam-eopi-dasi-sijakhaneun-hyeonsiljeokin",
    "yeonseup-girokeul-namgimyeon-silryeoki-boipnida-piano-yeonseup-noteu-hwa",
    "cheoeum-mudaee-seon-dwi-neukkin-jeom-ireotge-jeongrihamyeon-daeumi-swiwo",
    "eumak-chwimireul-kkujunhi-ieoganeun-saramdeului-gongtong-seupgwan-7gaji",
    "beoseuking-gok-mokrok-guseong-saenggakhaebogi-cheot-gongyeoneul-wihan-se",
    "dongne-hapju-moim-chamyeo-jeon-junbi-cheot-hapjuga-pyeonhaejineun-chekeu",
    "yeonju-yeongsang-cheoeum-olril-ttae-maeumgajim-budam-julineun-junbi-bang",
    "akgi-dasi-sijakhamyeo-gyeokgi-swiun-seulreompeu-ireotge-neomgyeoboseyo",
    "yeonju-yeongsang-olril-ttae-soriwa-hwamyeon-jeomgeom-bangbeop-eoprodeu-j",
    "chwimi-baendeu-cheot-moim-jeonghaneun-bangbeop-moigi-jeone-jeonghal-geot",
    "odisyeon-jagisogae-junbi-yoryeong-1bun-ane-nareul-jeonhaneun-bangbeop",
    "beoseuking-junbi-sunseowa-jangso-maeneo-cheoeum-nagagi-jeon-hwakinhal-ge",
    "cheot-hapju-nal-neukkin-jeomgwa-junbi-tip-cheoeum-matchwo-bol-ttae-gyeok",
    "akgi-neutge-sijakhan-saramui-hyeonsiljeokin-mokpyo-seugi-naiboda-gyehoek",
    "yeonseupi-jeongchegiil-ttae-maeum-dajapneun-bangbeop-meomchun-neukkimeul",
    "akgi-baeuda-pogihago-sipeul-ttae-mokpyo-dasi-jjogaegi-jakeun-danwiro-ieo",
    "mudae-ap-ginjangeul-julineun-junbi-gwajeong-jeongri-yeonju-jeon-chekeuri",
    "hapju-kkeutnago-pideubaek-jugobatneun-daehwa-bangsik-tim-bunwigi-jikineu",
    "jjaleun-yeonseupi-ssatyeo-silryeoki-doeneun-gwajeong-girokhagi",
    "hapju-cheot-gokeul-timi-hamkke-jeonghaneun-bangbeopgwa-gijun",
    "yeonseup-uiyoki-tteoleojil-ttae-dolabol-jilmun-daseot-gaji",
    "bappeun-ilsangeseo-akgi-yeonseup-sigan-mandeuneun-beop-jjalado-kkujunhan",
    "gongyeon-kkeutnago-pideubaek-batneun-maeumgajim-pyeonggareul-seongjangeu",
    "akgi-yeonseup-ilji-sseuneun-beop-girokeuro-silryeokeul-ssatneun-bangbeop",
    "hamkke-yeonseuphaneun-chingu-mandeulgo-yujihaneun-beop-yeonseup-meiteu-g",
    "cheoeum-hapju-ganeun-nal-junbihaneun-maeumgajimgwa-hyeonjang-chekeu-yory",
    "akgi-yeonseup-cheot-dal-dolaboneun-girokbeop-byeonhwareul-nuneuro-hwakin",
    "yeonseup-yeongsang-jjikeoseo-jeomgeomhaneun-beop-gakdo-hwakin-hangmok-ga",
    "gongyeon-ap-ginjang-puneun-bangbeop-mudae-jeon-junbiwa-hoheup-yeonseup-j",
    "eumak-chwimi-mokpyo-seuneun-beop-orae-ieoganeun-jakeun-gyehoek-mandeulgi",
    "yeonseupi-jeongchegiil-ttae-dolpahaneun-beop-wonin-jindangwa-yeonseup-se",
    "beoseuking-cheoeum-junbihaneun-sarameul-wihan-jeomgeom-gok-seonjeongbute",
    "hapju-jung-sori-gyeopchil-ttae-jeongrihaneun-beop-eumyeokgwa-yeokhal-nan",
    "kkujunhi-yeonseuphaneun-saramdeului-seupgwan-ttara-hagi-swiun-yeonseup-r",
    "yeonseupsil-iyong-maeneo-jeongri-yeyakbuteo-toesilkkaji-chekeuriseuteu",
    "yeonjuhoe-chodae-mungu-sseuneun-beop-guseong-yosowa-jakseong-yoryeong-je",
    "akgireul-cheoeum-baeun-nal-girok-namgigi-najunge-gajang-sojunghaejineun",
    "yeonseup-girok-noteu-sseuneun-beop-kkujunhan-silryeok-hyangsangeul-mande",
    "mudae-insa-yoryeong-cheot-gongyeoneseo-ginjanghaji-ango-jayeonseureopge",
    "cheot-mudae-jeonnal-junbi-rutin-ginjang-julineun-haru-chekeuriseuteu",
    "cheot-hapjueseo-baeuneun-geotdeul-cheoeumira-danghwanghaetdeon-sungan-ge",
    "mudae-uisang-junbi-chekeuriseuteu-gongyeon-dangil-danghwanghaji-anneun-b",
    "onrain-reseungwa-daemyeon-reseun-bigyo-jangdanjeomgwa-naege-matneun-seon",
    "eumak-donghohoe-goreuneun-beop-baendeu-hapju-moim-seontaek-gijungwa-hwak",
    "akgi-cheoeum-baeul-ttae-heunhan-silsuwa-pihaneun-bangbeop-7gaji",
    "mudae-maeneo-gibon-jeongri-ipjangbuteo-insakkaji-cheoeum-seoneun-mudae-c",
    "yeonju-yeongsang-chwalyeong-yoryeong-soriwa-hwamyeoneul-kkalkkeumhage-da",
    "gongyeon-setriseuteu-guseong-bangbeop-heureumgwa-wangeupeul-goryeohan-go",
    "riheoseol-iljeong-jjaneun-beop-baendeu-hapjureul-alchage-junbihaneun-sun",
    "hapju-hu-pideubaek-jugobatneun-beop-tim-bunwigireul-jikineun-daehwa-gisu",
    "eumak-jeojakgwon-gicho-gaenyeom-akboreul-sseugi-jeone-aladul-keun-geurim",
    "yeonjuhoe-hugi-sseuneun-beop-gieoki-heuryeojigi-jeone-namgineun-girok-yo",
    "gongyeon-jeon-ginjang-daseurineun-beop-mudae-apeseo-chimchakhaejineun-ju",
    "akgi-yeonseup-seulreompeu-geukbokhaneun-beop-jeongchegireul-jinaneun-hye",
    "baendeu-guin-saiteu-iyong-yoryeong-membeoreul-chatgo-jiwonhal-ttae-silje",
    "chwimi-baendeu-guingeul-sseuneun-beop-jiwonjaga-ikgo-yeonrakhago-sipeoji",
    "baendeu-hapju-yongeo-jeongri-cheoeum-hapjusileseo-jaju-deutneun-mal-hann",
    "baendeu-hapjugok-goreuneun-gijun-7gaji-membeo-sujungwa-pyeonseonge-matne",
    "baendeu-hapju-junbimul-chekeuriseuteu-cheot-hapju-jeone-hwakinhal-geotde",
    "bokeol-yeonseup-ilji-sseuneun-beop-maeil-3julro-silryeok-byeonhwareul-nu",
  ]),
  contest: new Set<string>([
    "beoseuking-daehoe-chamga-junbi-gok-seonjeong-seteu-guseong-hyeonjang-jeo",
    "gongmojeon-jeojakgwon-pyogi-hwakin-sunseo-jechul-jeon-jeomgeom-mokrok",
    "gongmojeon-demo-guseong-simsahaneun-saramui-siseoneseo-junbihagi",
    "gongmojeon-demo-eumwon-magam-jeon-hwakin-mokrok-jechul-jeon-jeomgeom-sun",
    "gongmojeon-gasa-jeomgeom-chekeuriseuteu-pyohyeoneul-dadeumgo-jeongrihane",
    "gongmojeon-simsa-gijun-ikgo-gok-dadeumneun-beop-jechul-jeon-jeomgeom-sun",
    "gongmojeon-akbo-cheombu-hyeongsik-jeomgeom-jechul-jeone-hwakinhal-pail-g",
    "gongmojeon-eumwon-maseuteoring-hwakin-chekeuriseuteu-jechul-jeon-kkok-je",
    "gongmojeon-jeopsu-jeon-gyujeong-ikneun-sunseo-notchigi-swiun-hangmok-jeo",
    "gongmojeon-eumwon-jechul-pail-hyeongsikgwa-ireum-jeongrihaneun-bangbeop",
    "gongmojeon-demo-eumwon-gasa-jeojakgwon-hwakin-yoryeong-jechul-jeon-jeomg",
    "gongmojeon-demo-eumwon-jechul-jeon-jeomgeom-mokrok-pailbuteo-gasakkaji",
    "gongmojeon-eumwon-jemokgwa-sogaemun-sseuneun-beop-siljeon-gaideu",
    "gongmojeon-tim-chamga-yeokhal-nanuneun-beop-eumak-timi-chaekimeul-jeongr",
    "gongmojeon-simsa-gijun-hwakinhaneun-bangbeop-chamga-jeon-kkok-salpyeobol",
    "eumak-gongmojeon-jeopsu-jeon-junbimul-jeongri-yogang-hwakinbuteo-jechul",
    "gongmojeon-chulpum-eumwon-pail-jeomgeom-chekeuriseuteu-jechul-jeone-hwak",
    "gongmojeon-gasa-jeomgeom-chekeuriseuteu-jechul-jeon-hwakinhal-hangmok",
    "gongmojeon-demo-mikseu-jeomgeom-chekeuriseuteu-jechul-jeone-kkok-hwakinh",
    "gongmojeon-jiwonseo-jakseong-chekeuriseuteu-jeopsu-jeone-kkok-jeomgeomha",
    "gongmojeon-demo-eumwon-junbi-yoryeong-yogang-hwakinbuteo-pail-jeongrikka",
    "eumak-gongmojeon-junbi-chekeuriseuteu-yogang-bunseokbuteo-jechul-jeon-je",
    "odisyeon-junbi-bokeol-chekeuriseuteu-gok-seontaekbuteo-keondisyeon-gwanr",
    "beoseuking-junbi-chekeuriseuteu-jangso-hwakinbuteo-gok-guseong-jangbi-an",
    "baendeu-gongyeon-junbi-chekeuriseuteu-2gaewol-jeonbuteo-gongyeon-dangilk",
    "first-stage-checklist",
  ]),
  exam: new Set<string>([
    "ipsi-sichang-yeonseup-sijakhagi-akboreul-bogo-baro-noraehaneun-himeul-gi",
    "ipsi-hwaseonghak-gicho-gongbu-sunseo-cheoeum-sijakhaneun-suheomsaengeul",
    "ipsi-cheongeum-noteu-jeongrihaneun-beop-teulrin-munjereul-silryeokeuro-b",
    "ipsi-myeonjeop-jeonnal-keondisyeon-gwanri-sumyeon-siksa-yeonseup-mamuri",
    "ipsi-sichang-junbi-gyeireumeuro-bureuneun-yeonseup-sunseowa-jeomgeompyo",
    "ipsi-cheongeum-gicho-eumjeong-deutneun-yeonseup-du-eum-sai-geori-ikhigi",
    "ipsi-myeonjeop-junbi-yeonjujaga-jaju-batneun-jilmun-jeongriwa-dapbyeon-g",
    "ipsi-yeonseup-iljeong-jugan-gyehoek-jjaneun-beop-muri-eopi-ieo-ganeun-gu",
    "ipsi-yeonju-yeongsang-jechul-junbi-jeomgeom-chwalyeongbuteo-pail-jechulk",
    "ipsi-silgi-jeon-keondisyeon-gwanri-chekeuriseuteu-iljuil-jeonbuteo-dangi",
    "ipsi-silgi-gok-seontaekhal-ttae-goryeohal-jeom-yogang-hwakinbuteo-siyeon",
    "ipsi-silgi-jeon-moui-yeonjuro-jeomgeomhaneun-bangbeop-siljeon-daebi-chek",
    "ipsi-poteupolrio-gok-sunseo-jeonghaneun-beopgwa-guseong-gijun",
    "silyongeumak-ipsi-myeonjeop-gok-sogae-junbi-seongok-iyu-malhaneun-beop",
    "silyongeumak-ipsi-yeonju-yeongsang-junbi-yoryeong-chwalyeongbuteo-jeomge",
    "silyongeumak-ipsi-cheongeum-junbi-bangbeop-dangyebyeol-hunryeongwa-maeil",
    "silyongeumak-ipsi-yeonseupgok-goreuneun-gijun-rebel-jangreu-wanseongdo-g",
    "ipsi-gok-repeotori-guseonghaneun-beop-gok-seontaek-gijungwa-junbi-sunseo",
    "silyongeumak-ipsi-myeonjeop-junbi-jaju-naoneun-jilmungwa-dapbyeon-jeongr",
    "ipsi-silgi-yeonseup-iljeong-jjaneun-beop-siheomilkkaji-yeoksanhaneun-gye",
    "odisyeon-gok-seontaek-gijun-nae-gangjeomeul-boyeo-juneun-gok-goreuneun-b",
    "ipsi-gok-seonjeong-gijun-silryeokgwa-jeongonge-matneun-gok-goreuneun-beo",
    "silyongeumakgwa-ipsi-junbi-gicho-eodiseobuteo-sijakhago-mueoteul-jeomgeo",
    "exam-audition-song",
  ]),
  venue: new Set<string>([
    "gongyeonjang-daegisil-junbimul-chekeuriseuteu-mudae-jeon-chaenggimyeon-j",
    "bangeumgwa-heupeum-chai-hapjusil-yeonseupsil-soeum-munje-gubunhagi",
    "yeonseupsil-daegwan-iyong-chekeuriseuteu-yeyak-jeon-hwakinhal-geotgwa-iy",
    "hapjusil-cheoeum-iyonghal-ttae-aladul-jeom-yeyakbuteo-jeongrikkaji-sunse",
    "rehearsal-room-first-booking",
    "practice-room-monthly",
  ]),
};

/** 악기 입문 공용 사진 묶음 — 위에서부터 처음 맞는 묶음을 쓴다. [묶음, 제목 패턴, 사진 수] */
const BEGINNER_POOLS: ReadonlyArray<readonly [string, RegExp, number]> = [
  ["korean", /장구|대금|가야금|해금|국악|단소|북 연주|장단/, 1],
  ["ukulele", /우쿨렐레/, 1],
  ["kalimba", /칼림바/, 1],
  ["strings", /바이올린|첼로|비올라|현악/, 1],
  ["wind", /플루트|색소폰|클라리넷|트럼펫|트롬본|호른|관악|오카리나|하모니카|카주|리코더/, 2],
  ["bass", /베이스/, 5],
  ["drum", /드럼|스네어|하이햇|심벌|카혼|타악|스틱/, 5],
  ["vocal", /보컬|노래|발성|호흡|고음|목소리|가창|성대|합창/, 6],
  ["guitar", /기타|바레|카포|피크|스트로크|핑거스타일|프렛/, 6],
  ["piano", /피아노|건반|키보드|페달|연탄/, 6],
  ["produce", /작곡|편곡|믹싱|믹스|마스터링|DAW|녹음|오디오|미디|MIDI|프로듀싱|레코딩|인터페이스|마이크|비트|리버브|딜레이|샘플링|이펙터|앨범|음원/, 4],
  ["band", /합주|밴드|앙상블|리허설|공연|무대|버스킹|사운드 체크|연주회|세트리스트|셋리스트/, 3],
  ["theory", /악보|화성|코드|음계|스케일|박자|리듬|조표|음표|쉼표|이론|화음|조성|장조|단조|음정|청음|텐션|곡 구성|곡 구조|인트로|아웃트로|아티큘레이션|메이저|마이너|장3도|템포|BPM|메트로놈|기호/, 5],
];
const BEGINNER_FALLBACK = ["practice", 3] as const;

/** 글 주소로 정해지는 작은 수 — 같은 글은 늘 같은 사진 */
function pick(slug: string, n: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return (h % n) + 1;
}

/** 코드에 들어 있는 기본 대표 사진 주소. 없으면 null */
export function bundledArticleCover(
  category: string | null | undefined,
  slug: string | null | undefined,
  title?: string | null,
): string | null {
  if (!category || !slug) return null;
  if (category === "beginner") {
    const t = title ?? "";
    const hit = BEGINNER_POOLS.find(([, rx]) => rx.test(t));
    const [group, n] = hit ? [hit[0], hit[2]] : BEGINNER_FALLBACK;
    return `/covers/beginner/${group}-${pick(slug, n)}.jpg`;
  }
  return COVER_SLUGS[category]?.has(slug) ? `/covers/${category}/${slug}.jpg` : null;
}
