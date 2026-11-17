import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildDemoReply, EXAMPLE_QUESTIONS } from "../src/lib/ai/demo-responder";
import { formatSignedRate, formatSignedNumber, MINUS } from "../src/lib/format";
import { normalizeCandles, rangeStart } from "../src/lib/market/dates";
import { searchStocks } from "../src/lib/stocks";

describe("검색", () => {
  test("종목명 부분 일치", () => {
    assert.deepEqual(searchStocks("하이닉스").map((s) => s.code), ["000660"]);
    assert.deepEqual(searchStocks("naver").map((s) => s.code), ["035420"]);
  });
  test("종목코드 앞자리 일치", () => {
    assert.deepEqual(searchStocks("005930").map((s) => s.name), ["삼성전자"]);
  });
  test("결과 없음", () => {
    assert.equal(searchStocks("테슬라").length, 0);
  });
});

describe("포맷", () => {
  test("상승 +, 하락 − 부호", () => {
    assert.equal(formatSignedRate(1.234), "+1.23%");
    assert.equal(formatSignedRate(-0.5), `${MINUS}0.50%`);
    assert.equal(formatSignedNumber(-1200), `${MINUS}1,200`);
  });
});

describe("일봉 정규화", () => {
  test("정렬 + 중복 제거 + 기간 필터", () => {
    const c = (date: string, close = 1) => ({ date, open: 1, high: 1, low: 1, close, volume: 1 });
    const out = normalizeCandles([c("2026-11-03"), c("2026-11-01"), c("2026-11-03", 2), c("2026-10-01"), c("2026-11-02", 0)], "2026-10-15");
    assert.deepEqual(out.map((x) => x.date), ["2026-11-01", "2026-11-03"]);
    assert.equal(out[1].close, 2);
  });
  test("기간 시작일", () => {
    assert.equal(rangeStart("2026-11-17", "1M"), "2026-10-18");
    assert.equal(rangeStart("2026-11-17", "6M"), "2026-05-18");
    assert.equal(rangeStart("2026-08-31", "6M"), "2026-03-01");
  });
});

describe("데모 채팅 응답", () => {
  for (const root of EXAMPLE_QUESTIONS) {
    test(`${root}: 서로 다른 꼬리질문 10개 뒤 주제 선택으로 복귀`, () => {
      let reply = buildDemoReply(root);
      const questions = new Set<string>();
      const answers = new Set<string>();
      for (let step = 0; step < 10; step++) {
        assert.equal(reply.suggestions?.length, 1);
        const question = reply.suggestions![0];
        assert.ok(!questions.has(question));
        questions.add(question);
        reply = buildDemoReply(question);
        assert.ok(reply.demo);
        assert.ok(!reply.text.includes("아직 데모 채팅이라"));
        assert.ok(!answers.has(reply.text));
        answers.add(reply.text);
        assert.equal(buildDemoReply(`  ${question}  `).text, reply.text);
      }
      assert.equal(questions.size, 10);
      assert.deepEqual(reply.suggestions, [...EXAMPLE_QUESTIONS]);
    });
  }
  test("예시 질문에는 예시 응답", () => {
    const a = buildDemoReply(EXAMPLE_QUESTIONS[0]);
    assert.ok(a.demo && a.text.includes("PER"));
    const b = buildDemoReply(EXAMPLE_QUESTIONS[1], { code: "005930", name: "삼성전자" });
    assert.ok(b.text.includes("삼성전자(005930)"));
  });
  test("범위 밖 질문은 예시 질문 안내", () => {
    const r = buildDemoReply("내일 삼성전자 오를까?");
    assert.deepEqual(r.suggestions, [...EXAMPLE_QUESTIONS]);
  });
});

describe("커뮤니티 더미 데이터", async () => {
  const { seedPosts, seedComments, allSeedPosts } = await import("../src/lib/community/seed");
  const { STOCKS } = await import("../src/lib/stocks");
  test("종목마다 예시 글 12개, 이름 치환 완료, 결정적", () => {
    for (const s of STOCKS) {
      const posts = seedPosts(s.code);
      assert.equal(posts.length, 12, s.name);
      assert.ok(posts.every((p) => !p.content.includes("{name}") && p.demo));
      assert.equal(new Set(posts.map((p) => p.id)).size, 12);
    }
    assert.equal(allSeedPosts().length, STOCKS.length * 12);
  });
  test("댓글 수 = 실제 예시 댓글 개수, 글보다 늦게 작성", () => {
    for (const p of allSeedPosts()) {
      const comments = seedComments(p.id);
      assert.equal(comments.length, p.comments, p.id);
      assert.ok(comments.every((c) => c.createdAt > p.createdAt));
    }
  });
});
