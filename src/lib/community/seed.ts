import { findStock, STOCKS } from "@/lib/stocks";
import type { CommunityComment, CommunityPost, PostTag } from "./types";

/**
 * 데모 커뮤니티 더미 데이터 (게시글 + 댓글).
 * 실제 사용자 글이 아니며, 특정 매매를 권하거나 시세를 예측하지 않는 일반적인 내용만 담는다.
 * 종목코드를 시드로 한 결정적 난수로 고르므로 같은 종목은 항상 같은 글이 나온다.
 */

type Template = { tag: PostTag; text: string };

/** 모든 종목 공통 */
const COMMON: Template[] = [
  { tag: "의견", text: "{name} 장기로 조금씩 모아가는 중이에요. 단기 등락보다는 분기 실적 위주로 보려고 합니다." },
  { tag: "의견", text: "한 번에 들어가기보다 나눠서 접근하고 있어요. 각자 기준을 정해 두는 게 마음이 편하더라고요." },
  { tag: "의견", text: "차트만 보지 말고 {name} 사업보고서도 한 번 읽어 보세요. 사업 구조를 알고 나니 뉴스가 다르게 읽힙니다." },
  { tag: "의견", text: "커뮤니티 분위기에 휩쓸리지 않으려고 매매 이유를 메모장에 적어 두고 있어요. 나중에 돌아보면 공부가 많이 됩니다." },
  { tag: "의견", text: "하루하루 등락 보면 피곤해서 주말에 한 번만 확인하기로 했어요. 오히려 판단이 차분해지네요." },
  { tag: "의견", text: "{name}만 들고 있으니 비중이 너무 커져서 다른 업종도 공부 중입니다. 분산이 생각보다 어렵네요." },
  { tag: "의견", text: "실적 발표 전후로 커뮤니티가 엄청 시끄러운데, 숫자 나오면 원문부터 보는 게 제일 정확한 것 같아요." },
  { tag: "질문", text: "{name} 다음 실적 발표 일정 아시는 분 계신가요? 어디서 확인하는지 궁금해요." },
  { tag: "질문", text: "PER이랑 PBR 중에 {name} 같은 종목은 뭘 더 중요하게 봐야 할까요?" },
  { tag: "질문", text: "배당 관련 공시는 보통 언제쯤 나오나요? 주식 처음 시작해서 잘 모르겠어요." },
  { tag: "질문", text: "거래량이 평소보다 많이 늘었을 때 다들 뭘 먼저 확인하세요?" },
  { tag: "질문", text: "연결 재무제표랑 별도 재무제표 차이가 뭔가요? {name} 볼 때는 어느 쪽을 봐야 하나요?" },
  { tag: "질문", text: "수정주가가 뭔지 아시는 분? 차트 볼 때 예전 가격이 다르게 나와서 헷갈려요." },
  { tag: "질문", text: "외국인·기관 수급은 어디서 보시나요? 볼 때 주의할 점도 궁금합니다." },
  { tag: "정보", text: "공시는 DART(전자공시시스템)에서 바로 확인할 수 있어요. 소문보다 공시를 먼저 보는 습관 추천합니다." },
  { tag: "정보", text: "{name} IR 자료는 회사 홈페이지 투자정보 메뉴에 올라와요. 실적 발표 자료가 정리돼 있어서 보기 좋습니다." },
  { tag: "정보", text: "증권사 리포트는 한 곳만 보지 말고 여러 곳을 비교해서 보는 게 좋더라고요. 가정이 서로 다를 때가 많아요." },
  { tag: "정보", text: "상세 화면에서 6개월 차트로 바꿔 보면 흐름이 한눈에 들어와요. 아래 거래량 막대도 같이 보세요." },
  { tag: "정보", text: "실적 발표 컨퍼런스콜 녹음이나 요약본이 IR 페이지에 올라오는 경우가 많아요. 질의응답 부분이 특히 유익합니다." },
  { tag: "정보", text: "용어가 어려우면 AI 탭 예시 질문부터 눌러 보세요. 거래량 읽는 법 정리가 꽤 깔끔해요." },
];

/** 업종별 */
const SECTOR: Record<string, Template[]> = {
  반도체: [
    { tag: "질문", text: "D램이랑 낸드 가격 동향은 어디서 확인하세요? {name} 실적이랑 같이 보고 싶어서요." },
    { tag: "정보", text: "반도체는 업황 사이클을 같이 봐야 해서 재고 수준이랑 설비투자 계획 기사를 챙겨 보는 편이에요." },
    { tag: "의견", text: "HBM 관련 뉴스가 많아서 용어부터 정리하고 있어요. 기술 용어 알고 나니 기사 읽기가 훨씬 수월합니다." },
    { tag: "질문", text: "메모리랑 파운드리 사업이 어떻게 다른지 쉽게 설명해 주실 분 계신가요?" },
  ],
  인터넷: [
    { tag: "정보", text: "{name}은 광고, 커머스, 콘텐츠 등 사업부별 매출 비중이 공시에 나와 있어요. 어디서 돈을 버는지 먼저 보세요." },
    { tag: "질문", text: "플랫폼 기업은 이용자 수 지표를 어디서 확인할 수 있나요?" },
    { tag: "의견", text: "자회사가 많은 회사라 연결 실적이랑 본업 실적을 나눠서 보려고 노력 중입니다." },
  ],
  자동차: [
    { tag: "정보", text: "자동차 회사는 매월 초에 전월 판매 실적을 발표해요. 국내·해외 판매를 나눠서 보면 흐름이 보입니다." },
    { tag: "질문", text: "환율이 자동차 회사 실적에 어떤 식으로 영향을 주는지 궁금해요." },
    { tag: "의견", text: "전기차, 하이브리드 비중 변화가 궁금해서 차종별 판매 자료를 찾아보고 있어요." },
  ],
  "2차전지": [
    { tag: "정보", text: "배터리 업종은 원재료(리튬 등) 가격과 고객사 전기차 판매를 같이 보는 게 도움이 됐어요." },
    { tag: "질문", text: "수주 잔고는 어디서 확인하나요? {name} 공시에 나오는지 궁금합니다." },
    { tag: "의견", text: "업종 특성상 변동이 커서 저는 공부용으로 소액만 관찰하고 있어요." },
  ],
  바이오: [
    { tag: "정보", text: "바이오는 임상 단계(1상·2상·3상)와 허가 일정이 중요해서 공시랑 학회 발표를 같이 확인하는 편이에요." },
    { tag: "질문", text: "CDMO가 정확히 무슨 사업인지 쉽게 설명해 주실 분 있나요?" },
    { tag: "의견", text: "용어가 어려워서 사업보고서의 '사업의 내용' 부분부터 천천히 읽고 있어요." },
  ],
};

const STOCK_SECTOR: Record<string, keyof typeof SECTOR> = {
  "005930": "반도체",
  "000660": "반도체",
  "035420": "인터넷",
  "035720": "인터넷",
  "005380": "자동차",
  "373220": "2차전지",
  "207940": "바이오",
  "068270": "바이오",
};

/** 말머리에 어울리는 예시 댓글 */
const COMMENTS: Record<PostTag, string[]> = {
  의견: [
    "공감합니다. 저도 비슷하게 하고 있어요.",
    "메모하는 습관 좋네요. 저도 따라 해 볼게요.",
    "각자 기준대로 하는 게 맞는 것 같아요.",
    "저는 주말에 몰아서 보는데 확실히 덜 흔들려요.",
    "사업보고서 생각보다 읽을 만하더라고요.",
    "차분한 글 좋네요. 이런 글 많아졌으면 좋겠어요.",
    "분산 어렵죠… 업종 공부부터 천천히 하고 있어요.",
  ],
  질문: [
    "DART에서 회사 이름으로 검색하면 바로 나와요.",
    "IR 페이지에 일정 공지가 먼저 올라오더라고요.",
    "저도 궁금했어요. 답변 기다립니다!",
    "AI 탭 예시 질문에 비슷한 설명 있어요.",
    "처음엔 다 헷갈려요. 사업보고서 앞부분부터 보시면 도움 돼요.",
    "업종마다 보는 지표가 달라서 같은 업종끼리 비교해 보세요.",
    "증권사 앱 종목 정보 탭에도 정리돼 있어요.",
  ],
  정보: [
    "좋은 정보 감사합니다!",
    "몰랐는데 바로 확인해 봤어요. 감사해요.",
    "리포트 여러 개 비교하는 거 정말 중요한 것 같아요.",
    "원문 확인이 제일 정확하죠. 공감합니다.",
    "저장해 두고 볼게요.",
    "IR 자료 Q&A 부분 정말 유익하더라고요.",
    "초보한테 큰 도움이 되는 글이네요.",
  ],
};

const AUTHORS = [
  "가치를찾는곰", "새벽차트", "적립식개미", "공시읽는사람", "느긋한투자", "배당좋아",
  "초보주린이", "분기실적러", "숲을보자", "메모하는개미", "출근전5분", "재무제표공부중",
  "장기보유러", "차분한고래", "리포트수집가", "점심시간투자",
];

/** 예시 글 기준 시각 (샘플 시세 기준일 장 마감 무렵, KST) */
const SEED_BASE = Date.parse("2026-11-13T16:00:00+09:00");
const POSTS_PER_STOCK = 12;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const postCache = new Map<string, CommunityPost[]>();
const commentCache = new Map<string, CommunityComment[]>();

function build(code: string) {
  const stock = findStock(code);
  if (!stock) return { posts: [], comments: [] };

  const rand = mulberry32(Number(code) * 7919 + 17);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const sector = SECTOR[STOCK_SECTOR[code]] ?? [];
  // 업종 글은 모두, 나머지는 공통 글에서 무작위로 채운다
  const pool = [...COMMON];
  const chosen: Template[] = [...sector];
  while (chosen.length < POSTS_PER_STOCK && pool.length) {
    chosen.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  // 섞기
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  const posts: CommunityPost[] = [];
  const comments: CommunityComment[] = [];
  let hoursAgo = 0.3;
  chosen.forEach((t, i) => {
    hoursAgo += 0.5 + rand() * 11;
    const id = `seed-${code}-${i}`;
    const createdAt = SEED_BASE - hoursAgo * 3_600_000;
    const author = pick(AUTHORS);
    const commentCount = Math.floor(rand() * 6);
    const used = new Set<string>();
    for (let c = 0; c < commentCount; c++) {
      let text = pick(COMMENTS[t.tag]);
      for (let k = 0; k < 4 && used.has(text); k++) text = pick(COMMENTS[t.tag]);
      used.add(text);
      let commenter = pick(AUTHORS);
      if (commenter === author) commenter = pick(AUTHORS);
      comments.push({
        id: `${id}-c${c}`,
        postId: id,
        author: commenter,
        content: text,
        createdAt: new Date(createdAt + (c + 1) * (10 + rand() * 50) * 60_000).toISOString(),
        demo: true,
      });
    }
    posts.push({
      id,
      code,
      author,
      tag: t.tag,
      content: t.text.replaceAll("{name}", stock.name),
      createdAt: new Date(createdAt).toISOString(),
      likes: Math.floor(rand() * 90) + (t.tag === "정보" ? 25 : 0),
      comments: commentCount,
      demo: true,
    });
  });
  return { posts, comments };
}

export function seedPosts(code: string): CommunityPost[] {
  if (!postCache.has(code)) {
    const { posts, comments } = build(code);
    postCache.set(code, posts);
    for (const p of posts) commentCache.set(p.id, comments.filter((c) => c.postId === p.id));
  }
  return postCache.get(code)!;
}

export function seedComments(postId: string): CommunityComment[] {
  const code = postId.split("-")[1];
  if (code) seedPosts(code);
  return commentCache.get(postId) ?? [];
}

/** 전체 종목 예시 글 */
export function allSeedPosts(): CommunityPost[] {
  return STOCKS.flatMap((s) => seedPosts(s.code));
}
