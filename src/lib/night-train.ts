// ============================================================================
// 23:30 — NIGHT TRAIN MYSTERY
//
// 探索型マーダーミステリーADV（クリック操作）。停車中の寝台列車で起きた車掌
// 殺害事件を、聞き込みと証拠から解く。
//
// 設計メモ:
// - 時間切れ／タイムリープは「廃止」。時間消費・強制終了はなく、自由探索。
//   会話変化は〈聞いた順番〉〈既知情報〉〈親密度〉〈フラグ進行〉で起こす。
// - データ駆動: 部屋・人物・会話・真相・エンディングをここに置き、エンジン
//   (components/night-train/game.tsx) は中身を知らずに描画する。
// - 解けること: 犯人特定の決め手（死亡時刻・施錠トリック・アリバイ崩し・動機）
//   は順番に依存せず必ず到達できるようにする。
// ============================================================================

export type RoomId =
  | "compartment"
  | "shower"
  | "corridor"
  | "lounge"
  | "diner"
  | "stairs";

export type Room = {
  id: RoomId;
  name: string;
  /** 車両としての並び順（間取り図の表示順）。 */
  order: number;
  /** 部屋に入ったときの一文。 */
  desc: string;
};

export const ROOMS: Room[] = [
  { id: "corridor",    name: "廊下",         order: 0, desc: "各車両へ繋がる通路。" },
  { id: "compartment", name: "客室",         order: 1, desc: "乗客たちの個室が連なっている。" },
  { id: "lounge",      name: "ラウンジ",     order: 2, desc: "革張りのソファとピアノ。" },
  { id: "diner",       name: "食堂車",       order: 3, desc: "コーヒーの匂いが残る。" },
  { id: "shower",      name: "シャワー室",   order: 4, desc: "濡れた床に湯気が残る。" },
  { id: "stairs",      name: "階段",         order: 5, desc: "二階へ続く狭い階段。" },
];

export type CharId =
  | "scoups" | "jeonghan" | "joshua" | "jun" | "hoshi" | "wonwoo"
  | "woozi" | "minghao" | "mingyu" | "dk" | "seungkwan" | "vernon" | "dino";

/** スクリプトシーンの1行。who: "narration"=地の文 / "me"=主人公 / CharId=その人物。 */
export type SceneLine = { who: "narration" | "me" | CharId; text: string };

// ---------------------------------------------------------------------------
// 会話の条件と効果
// ---------------------------------------------------------------------------

/** 会話ノードの出現条件。省略項目は無条件。 */
export type NTCondition = {
  /** これらのフラグがすべて立っている。 */
  flags?: string[];
  /** これらのフラグが立っていない。 */
  notFlags?: string[];
  /** これらの情報をすでに知っている（knownに含む）。 */
  known?: string[];
  /** この人物への親密度がこの値以上。 */
  affinityAtLeast?: number;
  /** これらの人物にすでに話しかけている。 */
  talkedTo?: string[];
  /** 一番最初に話しかけた相手がこの人物。 */
  firstTalk?: CharId;
};

/** 会話で得られる結果。 */
export type NTEffect = {
  /** 立てるフラグ。 */
  flags?: string[];
  /** 親密度の増減（この会話相手に対して）。 */
  affinity?: number;
  /** 推理メモに追加し、knownにも登録する情報。 */
  learn?: NTNote[];
  /** 手に入れるアイテムid。 */
  item?: string;
};

export type NoteCategory = "人物" | "証言" | "証拠" | "気になった点" | "未解決";

export type NTNote = {
  /** known判定にも使う一意id。 */
  id: string;
  category: NoteCategory;
  title: string;
  text: string;
};

/** 質問トピック（プレイヤーが選ぶ選択肢）。 */
export type NTTopic = {
  id: string;
  /** 選択肢のラベル。 */
  label: string;
  when?: NTCondition;
  /** 一度選ぶと消える（既定 true）。falseで何度でも聞ける。 */
  once?: boolean;
  /** 相手の返答（単発）。script を使う場合は省略可。 */
  reply?: string;
  /** 複数話者の小芝居を流す場合の台本（narration/me/CharId）。reply の代わり。 */
  script?: SceneLine[];
  /** true ならラベルを発話バブルに出さない（script の地の文で代替する用）。 */
  hideLabel?: boolean;
  /** 事件（殺人）が判明した後＝case-open フラグ後にだけ出る捜査トピック。 */
  phase2?: boolean;
  effect?: NTEffect;
};

/** あいさつ／初手のセリフ（順番・状態で変化）。 */
export type NTGreeting = {
  when?: NTCondition;
  text: string;
  priority?: number;
};

export type NTCharacter = {
  id: CharId;
  name: string;
  reading: string;
  role: string;
  startRoom: RoomId;
  initials: string;
  /** カードに常時出る短いプロフィール。 */
  bio: string;
  /** 初対面で「あなたは？」と尋ねたときの自己紹介。省略時は「{name}、{role}です。」。 */
  intro?: string;
  /** 一時的に話しかけられない状態。until のフラグが立つと解除される。 */
  busy?: { text: string; until?: string };
  greetings: NTGreeting[];
  topics: NTTopic[];
  isCulprit: boolean;
};

// ---------------------------------------------------------------------------
// 嘘と秘密（全員ぶん）
//
// 仕様: 全員が最低ひとつ嘘をつく。嘘＝犯人ではない。真犯人のみ「事件全体を
// 隠す嘘（cover）」を持つ。将来の「嘘タグUI」もこのデータを正とする。
// ---------------------------------------------------------------------------

export type LieType =
  | "self" // 自分を守る嘘
  | "protect" // 誰かを守る嘘
  | "secret" // 秘密を隠す嘘
  | "unrelated" // 事件に関係ない嘘
  | "cover"; // 犯行を隠す嘘（犯人のみ）

export const LIE_TYPE_LABEL: Record<LieType, string> = {
  self: "自分を守る嘘",
  protect: "誰かを守る嘘",
  secret: "秘密を隠す嘘",
  unrelated: "事件に関係ない嘘",
  cover: "犯行を隠す嘘",
};

export type NTSecret = {
  /** 隠していること。 */
  secret: string;
  /** ついている嘘（主張・セリフ）。 */
  lie: string;
  /** なぜその嘘をつくのか。 */
  reason: string;
  type: LieType;
};

// ---------------------------------------------------------------------------
// 真相・エンディング
// ---------------------------------------------------------------------------

export type NTEnding = {
  id: string;
  title: string;
  /** 本文。 */
  body: string[];
  good: boolean;
};

// ---------------------------------------------------------------------------
// 状態を読むビュー（エンジンから渡される）
// ---------------------------------------------------------------------------

export type NTView = {
  flags: string[];
  known: string[];
  affinity: Record<string, number>;
  talkedOrder: string[];
  usedTopics: string[];
};

function condMet(c: NTCondition | undefined, v: NTView, charId: CharId): boolean {
  if (!c) return true;
  if (c.flags && !c.flags.every((f) => v.flags.includes(f))) return false;
  if (c.notFlags && c.notFlags.some((f) => v.flags.includes(f))) return false;
  if (c.known && !c.known.every((k) => v.known.includes(k))) return false;
  if (c.talkedTo && !c.talkedTo.every((t) => v.talkedOrder.includes(t)))
    return false;
  if (c.firstTalk && v.talkedOrder[0] !== c.firstTalk) return false;
  if (
    c.affinityAtLeast != null &&
    (v.affinity[charId] ?? 0) < c.affinityAtLeast
  )
    return false;
  return true;
}

/** いま相手が口にする初手セリフを選ぶ（最優先・該当1つ）。 */
export function chooseGreeting(char: NTCharacter, v: NTView): string {
  const cands = char.greetings.filter((g) => condMet(g.when, v, char.id));
  cands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return (cands[0] ?? char.greetings[char.greetings.length - 1]).text;
}

/** いま選べる質問トピック。 */
export function availableTopics(char: NTCharacter, v: NTView): NTTopic[] {
  return char.topics.filter((t) => {
    // 捜査トピックは、事件が判明（case-open）するまで出さない。
    if (t.phase2 && !v.flags.includes("case-open")) return false;
    if (!condMet(t.when, v, char.id)) return false;
    if ((t.once ?? true) && v.usedTopics.includes(`${char.id}:${t.id}`))
      return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// キャスト
//
// 真相の核（mingyu 犯人 / 5人）は作り込み、残りは雰囲気＋秘密の器。
// 「全員が最低ひとつ嘘をつく／犯人だけが事件全体を隠す嘘を持つ」を踏襲。
// ---------------------------------------------------------------------------

const CAST: NTCharacter[] = [
  // ── 投資家：真犯人 ─────────────────────────────────────────
  {
    id: "mingyu",
    name: "ミンギュ",
    reading: "MINGYU",
    role: "投資家",
    startRoom: "compartment",
    initials: "MG",
    bio: "羽振りのいい若手投資家。終始ラウンジで寛いでいる——と本人は言う。",
    isCulprit: true,
    greetings: [
      {
        when: { flags: ["alibi-broken"] },
        priority: 10,
        text: "……写真だって？ ラウンジにいたと言っているだろう。（指先が、グラスの縁を強く撫でる）",
      },
      {
        when: { known: ["motive-fraud"] },
        priority: 5,
        text: "車掌とは面識がない。なぜそんなことを聞く。",
      },
      { text: "うわああっ、俺は何もしてないよ！" },
    ],
    topics: [
      {
        id: "scared",
        label: "なんでそんなに怯えてるんですか？",
        reply: "……俺を襲いに来たんじゃないの？",
        effect: { flags: ["mingyu-calmed"] },
      },
      {
        id: "tool",
        label: "事情を話す",
        when: { flags: ["mingyu-calmed"] },
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "mingyu", text: "な、なんだ……いや、でも解決しないとだよね？ その、何か開けられるものがあればいい？" },
          { who: "me", text: "そうですね……。" },
          { who: "mingyu", text: "なんか紐みたいなのがあったらいけそうだよね？ 他の人にも聞いてみて。" },
          { who: "me", text: "わかりました。" },
        ],
      },
      {
        id: "where",
        label: "事件のとき、どこに？",
        phase2: true,
        reply:
          "ずっとこのラウンジさ。ピアノの音を肴に飲んでいた。誰かに聞いてくれていい。",
        effect: {
          learn: [
            {
              id: "mingyu-alibi",
              category: "証言",
              title: "ミンギュのアリバイ",
              text: "「事件の間ずっとラウンジにいた」と主張。",
            },
          ],
        },
      },
      {
        id: "conductor",
        label: "車掌とは知り合い？",
        phase2: true,
        reply: "いいや。ただの乗客と乗務員だよ。",
        effect: { affinity: -1 },
      },
      {
        // 動機を掴んでから突くと、わずかに本音が漏れる（決め手ではない）。
        id: "soft",
        label: "ずいぶん落ち着いていますね",
        phase2: true,
        when: { known: ["motive-fraud"] },
        reply:
          "……金は人を落ち着かせる。失うものが多いほど、顔には出さないものさ。",
        effect: {
          learn: [
            {
              id: "mingyu-nervous",
              category: "気になった点",
              title: "ミンギュの不自然な平静",
              text: "「失うものが多いほど顔に出さない」と漏らした。",
            },
          ],
        },
      },
    ],
  },

  // ── トレインクルー：施錠トリックの鍵 ───────────────────────
  {
    id: "hoshi",
    name: "ホシ",
    reading: "HOSHI",
    role: "トレインクルー",
    startRoom: "corridor",
    initials: "HS",
    bio: "唯一車内を自由に動ける乗務員。マスターキーの管理者。",
    isCulprit: false,
    greetings: [
      {
        when: { flags: ["asked-key"] },
        text: "鍵のことは……本当に、僕の落ち度です。",
      },
      { text: "ど、どうしよう……！ 早く中を確かめたいのに、鍵が開けられなくて……！" },
    ],
    topics: [
      {
        id: "mop",
        label: "内鍵を開けられそうなものはないですか？",
        when: { notFlags: ["tried-mop"] },
        script: [
          { who: "hoshi", text: "なんかあったかな……" },
          { who: "hoshi", text: "あ、そうだ。掃除用具入れにモップがありました。" },
          { who: "me", text: "それで開けましょう！" },
          {
            who: "narration",
            text: "彼は駆け足で車両を出ると、木製の長いモップを手に戻り、割れた窓へ差し込んだ。",
          },
          { who: "hoshi", text: "あー……なんか角度が悪くてダメっぽいです。" },
          { who: "me", text: "ほかのものを探すしかないですね……" },
        ],
        effect: {
          flags: ["tried-mop", "treatment-done"],
          learn: [
            {
              id: "mop-failed",
              category: "気になった点",
              title: "モップでは届かない",
              text: "割れた窓からモップを差し込んだが、角度が悪く内鍵に届かない。別の道具が要る。",
            },
          ],
        },
      },
      {
        id: "locked",
        label: "車掌室は施錠されている？",
        reply:
          "ええ。内側からも外側からも、マスターキーがなければ開きません。",
        effect: {
          learn: [
            {
              id: "locked-room",
              category: "証拠",
              title: "施錠された車掌室",
              text: "車掌室はマスターキーでしか開閉できない。一見、密室。",
            },
          ],
        },
      },
      {
        id: "key",
        label: "マスターキーは今どこに？",
        reply:
          "それが……仮眠していた間、フックから消えていたんです。気づいたら戻っていた。誰かが持ち出して、戻した。",
        effect: {
          flags: ["asked-key"],
          learn: [
            {
              id: "key-missing",
              category: "証拠",
              title: "消えたマスターキー",
              text: "ホシの仮眠中、鍵束が一時持ち出され、戻されていた。外から施錠可能=密室は崩れる。",
            },
          ],
        },
      },
    ],
  },

  // ── 医師：死亡推定時刻 ─────────────────────────────────────
  {
    id: "joshua",
    name: "ジョシュア",
    reading: "JOSHUA",
    role: "医師",
    startRoom: "corridor",
    initials: "JS",
    bio: "穏やかな物腰の医師。倒れた車掌を最初に診た。",
    isCulprit: false,
    intro: "ああ、あなたも乗客の方ですか。私はジョシュア。医者です。",
    busy: {
      text: "治療をしている最中だから、今は話しかけない方が良いかも。",
      until: "treatment-done",
    },
    greetings: [{ text: "落ち着いてください。大丈夫、僕がついていますから。" }],
    topics: [
      {
        id: "tool",
        label: "内鍵を開けられそうなもの、ない？",
        reply: "医療道具なら少し。でも鍵開けには向かなくて……お役に立てず、すみません。",
      },
      {
        id: "time",
        label: "死亡推定時刻は？",
        phase2: true,
        reply:
          "体温と硬直から、23時10分前後でしょう。停車してすぐの頃です。",
        effect: {
          learn: [
            {
              id: "death-time",
              category: "証拠",
              title: "死亡推定時刻 23:10",
              text: "医師の見立て。停車直後。アリバイはこの時刻が基準になる。",
            },
          ],
        },
      },
      {
        id: "wound",
        label: "死因は？",
        phase2: true,
        reply:
          "後頭部の打撲。背後から、ためらいなく一撃。顔見知りに油断したのかもしれない。",
        effect: {
          learn: [
            {
              id: "wound",
              category: "証拠",
              title: "死因＝背後からの一撃",
              text: "後頭部打撲。被害者は犯人に油断していた可能性。",
            },
          ],
        },
      },
    ],
  },

  // ── 作家：目撃者（親密度で詳細） ───────────────────────────
  {
    id: "wonwoo",
    name: "ウォヌ",
    reading: "WONWOO",
    role: "作家",
    startRoom: "compartment",
    initials: "WN",
    bio: "寡黙な小説家。眠れずに車内を歩いていたという。",
    isCulprit: false,
    greetings: [
      {
        when: { flags: ["scene-corridor-seen"], notFlags: ["asked-wonwoo-tool"] },
        priority: 8,
        text: "さっき、すごい音がしたけど……何かあったの？",
      },
      {
        when: { affinityAtLeast: 1 },
        priority: 5,
        text: "……あなたには話してもいい気がする。さっき、見たんだ。",
      },
      { text: "……眠れたものじゃないな、こんな夜は。" },
    ],
    topics: [
      {
        id: "lock-help",
        label: "事情を話す",
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "me", text: "それで……開けられそうなもの、ないですか？" },
          { who: "wonwoo", text: "うーん。生憎、役に立ちそうなものはないなぁ。" },
          { who: "me", text: "もし見つけたら教えてください。" },
          { who: "wonwoo", text: "分かったよ。" },
        ],
        effect: { flags: ["asked-wonwoo-tool"] },
      },
      {
        id: "walk",
        label: "夜は歩いていた？",
        phase2: true,
        reply: "ああ。廊下から車掌室前のあたりまで。眠れなくてね。",
        effect: { affinity: 1 },
      },
      {
        id: "saw",
        label: "何か見ましたか？",
        phase2: true,
        when: { affinityAtLeast: 1 },
        reply:
          "23時頃、車掌室前で男がひとり。背格好は……ラウンジにいる、あの投資家によく似ていた。",
        effect: {
          flags: ["witness-mingyu"],
          learn: [
            {
              id: "witness",
              category: "証言",
              title: "ウォヌの目撃",
              text: "23時頃、車掌室前にミンギュらしき男がいた。ラウンジにいたという主張と矛盾。",
            },
          ],
        },
      },
    ],
  },

  // ── 写真家：物的なアリバイ崩し ─────────────────────────────
  {
    id: "dk",
    name: "DK",
    reading: "DK",
    role: "写真家",
    startRoom: "lounge",
    initials: "DK",
    bio: "陽気な写真家。夜の車内をスナップして回っていた。",
    isCulprit: false,
    greetings: [{ text: "あれ、停まっちゃったね？ でも大丈夫、こういう時こそ笑顔だよ！ で、何があったの？" }],
    topics: [
      {
        id: "tool",
        label: "内鍵を開けられそうなもの、持ってない？",
        script: [
          { who: "dk", text: "鍵開け？ 僕はカメラと三脚くらいだなあ。あはは、役に立てなくてごめん！" },
          { who: "me", text: "ううん、ありがとう。" },
        ],
        effect: { flags: ["asked-dk-tool"] },
      },
      {
        // アリバイ崩しの写真は、室内を確認できた後（事件と分かってから）。
        id: "photos",
        label: "夜、写真を撮ってた？",
        when: { flags: ["case-open"] },
        reply:
          "ああ、夜の車内をいくつかね。……見るかい？ ほら、23時5分のラウンジ。ピアノの前は無人だ。誰も飲んじゃいない。",
        effect: {
          flags: ["alibi-broken"],
          learn: [
            {
              id: "photo",
              category: "証拠",
              title: "23:05 のラウンジ写真",
              text: "DKの写真にはラウンジが無人で写る。『ずっとラウンジにいた』証言は崩れる。",
            },
          ],
        },
      },
    ],
  },

  // ── 刑事：捜査の枠組み（と、ひとつの嘘） ───────────────────
  {
    id: "scoups",
    name: "エスクプス",
    reading: "S.COUPS",
    role: "刑事",
    startRoom: "corridor",
    initials: "SC",
    bio: "たまたま乗り合わせた刑事。現場を仕切ろうとしている。",
    isCulprit: false,
    busy: {
      text: "傷が痛々しい。治療を受けている最中だから、今は話しかけない方が良いかも。",
      until: "treatment-done",
    },
    greetings: [{ text: "大丈夫だ、落ち着け。みんなで何とかしよう。……手を貸してくれるか？" }],
    topics: [
      {
        id: "tool",
        label: "内鍵を開けられそうなもの、ない？",
        reply: "刑事の俺が、無茶は勧められないな。……でも、急いだほうがいい。",
      },
      {
        id: "case",
        label: "事件の概要は？",
        phase2: true,
        reply:
          "車掌が室内で殺された。扉は施錠。容疑者は乗客全員だ。動機を持つ者を探せ。",
        effect: {
          learn: [
            {
              id: "overview",
              category: "証言",
              title: "事件の概要",
              text: "車掌が施錠された室内で殺害。乗客全員が容疑者。",
            },
          ],
        },
      },
      {
        id: "motive",
        label: "動機を持つ人物は？",
        phase2: true,
        when: { known: ["overview"] },
        reply:
          "記者のスングァンが何か掴んでいるようだった。投資家の過去を嗅ぎ回っていた。",
        effect: {
          learn: [
            {
              id: "lead-seungkwan",
              category: "気になった点",
              title: "記者の調査",
              text: "スングァンが投資家ミンギュの過去を取材していたらしい。",
            },
          ],
        },
      },
    ],
  },

  // ── 記者：動機（詐欺）への導線 ─────────────────────────────
  {
    id: "seungkwan",
    name: "スングァン",
    reading: "SEUNGKWAN",
    role: "記者",
    startRoom: "lounge",
    initials: "SK",
    bio: "嗅覚の鋭い経済記者。何かを追ってこの列車に乗った。",
    isCulprit: false,
    greetings: [{ text: "ちょっとちょっと、これただ事じゃないでしょ！？ さっき何があったの？ 君、知ってる？" }],
    topics: [
      {
        id: "tool",
        label: "事情を話す",
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "seungkwan", text: "そうなんだ……うーん、ガラス窓から垂らして内鍵を引っ張れるものとか？ 何があるかなぁ……。" },
        ],
      },
      {
        id: "story",
        label: "何を取材している？",
        phase2: true,
        reply: "ある投資ファンドの粉飾だよ。被害者は——皮肉なものだ。",
        effect: { affinity: 1 },
      },
      {
        id: "fraud",
        label: "車掌と投資家の関係は？",
        phase2: true,
        when: { known: ["lead-seungkwan"] },
        reply:
          "車掌は元はその投資家の同僚でね。粉飾を内部告発しようとしていた。口を塞ぎたい人間がいたわけだ。",
        effect: {
          flags: ["motive-known"],
          learn: [
            {
              id: "motive-fraud",
              category: "証言",
              title: "動機＝粉飾の告発",
              text: "車掌は投資家ミンギュの元同僚で、粉飾を告発しようとしていた。",
            },
          ],
        },
      },
    ],
  },

  // ── 以降は雰囲気＋秘密の器（後で肉付け） ───────────────────
  {
    id: "jeonghan",
    name: "ジョンハン",
    reading: "JEONGHAN",
    role: "弁護士",
    startRoom: "lounge",
    initials: "JH",
    bio: "如才ない弁護士。誰とでも如才なく話す。",
    isCulprit: false,
    greetings: [{ text: "ん？ リクエスト？ 最近の曲はあんまり詳しくないよ、僕。" }],
    topics: [
      {
        id: "request",
        label: "リクエスト？",
        reply: "あれ、ピアノの演奏リクエストかと思ったけど……違った？",
        effect: { flags: ["jeonghan-request"] },
      },
      {
        id: "tool",
        label: "事情を話す",
        when: { flags: ["jeonghan-request"] },
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "jeonghan", text: "そうなんだ。あぁ、でも役に立つようなものは持ってないなぁ。ごめんね。" },
        ],
      },
      {
        id: "advice",
        label: "助言をください",
        phase2: true,
        reply: "全員が何かを隠している。だが隠し事と人殺しは別物だよ。",
        effect: {
          learn: [
            {
              id: "advice-lies",
              category: "気になった点",
              title: "弁護士の助言",
              text: "「全員が隠し事を持つが、隠し事と殺人は別」。嘘＝犯人ではない。",
            },
          ],
        },
      },
    ],
  },
  {
    id: "jun",
    name: "ジュン",
    reading: "JUN",
    role: "会社員",
    startRoom: "diner",
    initials: "JN",
    bio: "出張帰りの会社員。やけに汗をかいている。",
    isCulprit: false,
    greetings: [{ text: "ねぇ、さっきから列車が動いてないけど、何かあったのかな？" }],
    topics: [
      {
        id: "tool",
        label: "事情を話す",
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "jun", text: "そうなの？ やばいね……僕に何かできることはある？" },
          { who: "me", text: "車掌室の内鍵を開けられるようなものがあると……。" },
          { who: "jun", text: "うーん、ごめんね。今は何も持ってなくて……。何か見つけたら持っていくよ！" },
          { who: "me", text: "ありがとうございます。" },
        ],
      },
      {
        id: "calm",
        label: "落ち着いて。ゆっくりでいい",
        phase2: true,
        reply: "……すみません。少し、気が動転していて。あなたは、優しいんですね。",
        effect: { affinity: 1 },
      },
      {
        id: "secret",
        label: "本当に何も？",
        phase2: true,
        when: { affinityAtLeast: 1 },
        reply:
          "……経費を、ごまかしてて。それがバレるのが怖くて。事件とは関係ないんです。",
        effect: {
          learn: [
            {
              id: "jun-secret",
              category: "人物",
              title: "ジュンの秘密",
              text: "経費の不正。事件とは無関係の嘘。",
            },
          ],
        },
      },
    ],
  },
  {
    id: "woozi",
    name: "ウジ",
    reading: "WOOZI",
    role: "元軍人",
    startRoom: "stairs",
    initials: "WJ",
    bio: "寡黙な元軍人。荷物室で何かを探していた。",
    isCulprit: false,
    greetings: [{ text: "ん……？ 何の騒ぎだ？" }],
    topics: [
      {
        id: "tool",
        label: "事情を話す",
        hideLabel: true,
        script: [
          { who: "narration", text: "私は先ほどあったことを説明した。" },
          { who: "me", text: "何か、開けられそうなものはないですか？" },
          { who: "woozi", text: "あー……いや、ない。悪い。" },
          { who: "me", text: "そうですか……ありがとうございます。" },
        ],
        effect: { flags: ["asked-woozi-tool"] },
      },
      {
        id: "luggage",
        label: "何を探している？",
        phase2: true,
        reply: "亡くした戦友の形見だ。事件とは関わりない。詮索するな。",
        effect: {
          learn: [
            {
              id: "woozi-secret",
              category: "人物",
              title: "ウジの事情",
              text: "戦友の形見を探している。事件とは無関係らしい。",
            },
          ],
        },
      },
    ],
  },
  {
    id: "minghao",
    name: "ミンハオ",
    reading: "THE8",
    role: "教授",
    startRoom: "shower",
    initials: "MH",
    bio: "機械工学の教授。停車した機関を一人で眺めている。",
    isCulprit: false,
    greetings: [{ text: "……これ、ただの故障じゃないよ。誰かが、わざと止めたんだ。" }],
    topics: [
      {
        id: "stop",
        label: "なぜ列車は止まった？",
        reply:
          "非常ブレーキが手動で引かれている。事件の直前にね。逃げ場を断つために。",
        effect: {
          learn: [
            {
              id: "emergency-brake",
              category: "気になった点",
              title: "手動の非常停止",
              text: "事件直前、誰かが手動で列車を止めた。外へ出られない状況を作った。",
            },
          ],
        },
      },
    ],
  },
  {
    id: "vernon",
    name: "バーノン",
    reading: "VERNON",
    role: "通訳",
    startRoom: "shower",
    initials: "VN",
    bio: "多言語を操る通訳。乗客たちの会話を聞くともなく聞いている。",
    isCulprit: false,
    greetings: [{ text: "ん、なんか騒がしいね。……僕、こういうの色々聞こえちゃうタイプでさ。" }],
    topics: [
      {
        id: "overheard",
        label: "何か聞こえた？",
        reply:
          "投資家が電話で揉めていた。『あの男さえいなければ』とね。停車の少し前だ。",
        effect: {
          learn: [
            {
              id: "overheard-threat",
              category: "証言",
              title: "立ち聞きした脅し",
              text: "停車前、ミンギュが電話で『あの男さえいなければ』と話していた。",
            },
          ],
        },
      },
    ],
  },
  {
    id: "dino",
    name: "ディノ",
    reading: "DINO",
    role: "学生",
    startRoom: "diner",
    initials: "DN",
    bio: "好奇心旺盛な学生。怖がりながらも事件を追いたがる。",
    isCulprit: false,
    greetings: [{ text: "せ、先輩……！ なんか騒がしいけど、何かあったんですか？ 俺、一人だと怖くて……。" }],
    topics: [
      {
        id: "tool",
        label: "内鍵を開けられそうなもの、ない？",
        reply: "ぼ、僕も探してみます！ でも今は何も持ってなくて……すみません先輩！",
      },
      {
        id: "help",
        label: "何か手伝える？",
        phase2: true,
        reply:
          "あ、そういえば階段の隅に、誰かが落とした手袋があったよ。革の、高そうなやつ。",
        effect: {
          learn: [
            {
              id: "glove",
              category: "証拠",
              title: "落ちていた革手袋",
              text: "階段の隅に高級な革手袋。持ち主は不明（後の調査向け）。",
            },
          ],
        },
      },
    ],
  },
];

/** 各メンバーの嘘・理由・秘密。犯人(mingyu)のみ type:"cover"。 */
export const SECRETS: Record<CharId, NTSecret> = {
  mingyu: {
    secret: "車掌殺害そのもの。粉飾を内部告発されかけていた。",
    lie: "事件の間、ずっとラウンジにいた。",
    reason: "自らの犯行と、口を塞いだ事実を隠すため。",
    type: "cover",
  },
  hoshi: {
    secret: "事件の時刻、持ち場を離れて仮眠していた（職務怠慢）。",
    lie: "鍵束はきちんと管理していた／鍵が消えたのは自分の落ち度だ。",
    reason: "乗務員としての管理責任を問われたくない。",
    type: "self",
  },
  joshua: {
    secret: "過去に医療過誤で患者を死なせ、職を追われている。",
    lie: "ただ乗り合わせただけの医師にすぎない。",
    reason: "消したい過去を知られたくない。",
    type: "secret",
  },
  wonwoo: {
    secret: "スランプで、乗客たちの人生を盗作の題材に観察していた。",
    lie: "眠れず歩いていただけだ。",
    reason: "創作のため盗み見ていたとは言えない。",
    type: "secret",
  },
  dk: {
    secret: "乗客を無断で（盗撮まがいに）撮り集めていた。",
    lie: "記録のために撮っているだけ、記録は嘘をつかない。",
    reason: "プライバシー侵害を隠すため。",
    type: "secret",
  },
  scoups: {
    secret: "停職中の刑事で、本来は捜査権限がない。",
    lie: "自分が現場を仕切る、素人は引っ込んでいろ。",
    reason: "刑事としての面子を保つため。",
    type: "self",
  },
  seungkwan: {
    secret: "被害者の車掌が情報源で、粉飾の証拠を渡されていた。",
    lie: "ただ取材で乗り合わせているだけ。",
    reason: "情報源と次の特ダネを守るため。",
    type: "protect",
  },
  jeonghan: {
    secret: "ミンギュの顧問弁護士で、利害関係がある。",
    lie: "中立な第三者として『無闇に話すな』と助言する。",
    reason: "依頼人ミンギュを守るため。",
    type: "protect",
  },
  jun: {
    secret: "会社の経費を横領している。",
    lie: "何も見ていない、関わりたくない。",
    reason: "自分の不正の発覚を恐れて。",
    type: "unrelated",
  },
  woozi: {
    secret: "亡き戦友の遺品を、規則を破って持ち出している。",
    lie: "自分の荷を確かめているだけだ。",
    reason: "事件とは無関係の私事だから。",
    type: "unrelated",
  },
  minghao: {
    secret: "過去に鉄道事故の責任者で、機械への恐れを抱えている。",
    lie: "冷静に原因を分析しているだけだ、と振る舞う。",
    reason: "トラウマと過去を悟られたくない。",
    type: "secret",
  },
  vernon: {
    secret: "立ち聞きした弱みで、ある乗客を強請ろうとしている。",
    lie: "ただ自然に聞こえてしまうだけだ。",
    reason: "自分の企みを隠すため。",
    type: "self",
  },
  dino: {
    secret: "身分を偽った無賃乗車で、本当の素性を隠している。",
    lie: "怖いから一緒に調べたい、と善意を装って近づく。",
    reason: "自分の身元がバレるのを避けるため。",
    type: "unrelated",
  },
};

export function getSecret(id: CharId): NTSecret {
  return SECRETS[id];
}

export const NIGHT_TRAIN = {
  id: "night-train",
  title: "23:30 — NIGHT TRAIN MYSTERY",
  reading: "NIGHT TRAIN MYSTERY",
  tagline:
    "ミラノ発ナポリ行きの寝台列車に乗り込んだあなたは、\n食堂車でフレンチを楽しんだ後、眠りについた。\n\n目を覚ますと列車は山間部で停止しているようだ。\n\n不審に思って廊下に出ると、\n突き当たりの車掌室前に数名の人影が見えた。",
  players: "1人用",
  duration: "約30分",
  color: "#3a3a3a",
  /** クリックで開始する導入。 */
  opening: [
    "ミラノ発ナポリ行きの寝台列車に乗り込んだあなたは、食堂車でフレンチを楽しんだ後、眠りについた。",
    "目を覚ますと列車は山間部で停止しているようだ。",
    "不審に思って廊下に出ると、突き当たりの車掌室前に数名の人影が見えた。",
  ],
  victim: "車掌 — この列車の乗務責任者。施錠された車掌室で、背後から殴打されていた。",
  /** クエスト一覧（クエストタブに表示）。unlock フラグが立つまではグレーアウト。 */
  quests: [
    { name: "脅迫文", unlock: "quest-threat", char: "mingyu" },
    { name: "偽物", unlock: "quest-fake", char: "jeonghan" },
    { name: "ミステリー小説", unlock: "quest-novel", char: "wonwoo" },
    { name: "救急箱", unlock: "quest-firstaid", char: "joshua" },
    { name: "データ復元", unlock: "quest-data", char: "dk" },
    { name: "報告書", unlock: "quest-report", char: "jun" },
  ] as { name: string; unlock?: string; char?: CharId }[],
  /** 部屋に初めて入ると自動で流れるスクリプトシーン（チャットノベル）。 */
  scenes: {
    corridor: [
      { who: "me", text: "何かあったんですか？" },
      { who: "joshua", text: "その、中で車掌さんが倒れているんですけど、中に入れなくて。" },
      { who: "me", text: "他に車掌さんは…？" },
      { who: "hoshi", text: "や、それが見当たらないんすよね。" },
      { who: "me", text: "…？ あなたは車掌室を開けられないんですか？ この列車で働いてるんでしょう？" },
      { who: "hoshi", text: "まだ新人なんで、マスターキー持ってないんですよ。" },
      { who: "scoups", text: "もう、そのガラス窓を割るしかないだろ。" },
      { who: "narration", text: "彼は消火器を手に取り、窓ガラスを叩き割った。その瞬間、派手な音を立てて消火器が暴発した。" },
      { who: "scoups", text: "うわ、痛っ" },
      { who: "narration", text: "飛び散った破片で、彼が腕を怪我してしまったようだ。" },
      { who: "narration", text: "窓ガラスは割れた。だが内鍵がかかっている。手を伸ばしても、ギリギリ届かない。" },
      { who: "narration", text: "何かを使って内鍵を開ける必要があるようだ。" },
    ],
  } as Partial<Record<RoomId, SceneLine[]>>,
  culpritId: "mingyu" as CharId,
  rooms: ROOMS,
  characters: CAST,
  /** 真犯人ENDに必要な決め手フラグ。 */
  solutionFlags: ["alibi-broken", "motive-known", "asked-key"],
  solution: [
    "犯人は ミンギュ（投資家）。",
    "医師の見立てで死亡は 23:10、停車直後（〈死亡推定時刻〉）。教授によれば、その直前に誰かが手動で非常停止をかけ、逃げ場を断っていた。",
    "ミンギュは『ずっとラウンジにいた』と証言したが、DKの〈23:05 のラウンジ写真〉は無人。ウォヌも 23時頃に車掌室前でミンギュらしき男を目撃。アリバイは崩れる。",
    "車掌室はマスターキーでしか開かない密室——だが、ホシの仮眠中に鍵束が一時持ち出され、戻されていた。外からの施錠が可能で、密室は偽装。",
    "動機は粉飾の告発。車掌はミンギュの元同僚で、粉飾を内部告発しようとしていた（記者スングァン）。通訳バーノンも『あの男さえいなければ』という電話を立ち聞きしている。",
    "油断した背後からの一撃（医師）。すべては、口を塞ぐための殺人だった。",
  ],
  endings: [
    {
      id: "truth",
      title: "真犯人 END",
      good: true,
      body: [
        "あなたは写真と目撃、消えた鍵、そして動機を並べた。ミンギュの余裕が、静かに剥がれ落ちていく。",
        "「……たかが乗客が」。吐き捨てた声は、もう先ほどの落ち着きを失っていた。",
        "夜明け、復旧した列車に警察が乗り込む。曇りガラスの向こうの灯りが、ようやく消えた。",
      ],
    },
    {
      id: "wrongful",
      title: "冤罪 END",
      good: false,
      body: [
        "あなたの告発に、その人は呆然と立ち尽くした。決定的な証拠は、別の場所にあったはずだ。",
        "本当の犯人は、混乱に紛れて表情を隠した。列車は朝を待つ。",
      ],
    },
    {
      id: "unsolved",
      title: "未解決 END",
      good: false,
      body: [
        "あなたは告発を諦めた。誰も裁かれないまま、列車は動き出す。",
        "車掌室の灯りだけが、まだ点いている。",
      ],
    },
  ] as NTEnding[],
};

export function getCharacter(id: CharId): NTCharacter | undefined {
  return CAST.find((c) => c.id === id);
}

export function charactersIn(room: RoomId): NTCharacter[] {
  return CAST.filter((c) => c.startRoom === room);
}

/** 一時的に話しかけられない場合はその理由テキストを返す。話せるなら null。 */
export function getBusy(char: NTCharacter, flags: string[]): string | null {
  if (!char.busy) return null;
  if (char.busy.until && flags.includes(char.busy.until)) return null;
  return char.busy.text;
}

/** 告発結果のエンディングidを決める。 */
export function evalAccusation(accusedId: CharId): string {
  return accusedId === NIGHT_TRAIN.culpritId ? "truth" : "wrongful";
}

export function getEnding(id: string): NTEnding {
  return (
    NIGHT_TRAIN.endings.find((e) => e.id === id) ?? NIGHT_TRAIN.endings[0]
  );
}
