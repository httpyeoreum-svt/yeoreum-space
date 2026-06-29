// ============================================================================
// Murder Mystery — browser-playable, single-player scenarios.
//
// The game *engine* (see components/murder-mystery/game-player.tsx) is generic:
// it renders whatever scenarios are listed here. To add a new mystery, append a
// fully-specified `MMScenario` to `SCENARIOS` — no engine changes needed.
//
// A scenario must be *solvable*: every fact the player needs to single out the
// culprit should appear in `clues` / `characters`, so the deduction is fair.
//
// Interrogation: each suspect has condition-guarded `statements`. What they say
// depends on game state — crucially the *order* you question people in. Keep the
// decisive evidence reachable regardless of order; let order add flavour/hints,
// never gate the solution behind one specific sequence.
// ============================================================================

export type MMDifficulty = "EASY" | "NORMAL" | "HARD";

/** Predicate over interrogation state. Omitted ⇒ always eligible. */
export type MMCondition = {
  /** This suspect was questioned exactly Nth (1-based) overall. */
  order?: number;
  /** Shown only after ALL of these suspects have been questioned. */
  after?: string[];
  /** Shown only while NONE of these have been questioned yet. */
  before?: string[];
  /** Shown only after ALL of these clues are discovered. */
  clues?: string[];
  /** Shown only after ALL of these topics are known. */
  topics?: string[];
};

/** One possible line of testimony. */
export type MMStatement = {
  text: string;
  when?: MMCondition;
  /** Facts learned by hearing this line (feed back into later conditions). */
  unlocks?: string[];
  /** Higher wins when several lines match. Defaults to 0. */
  priority?: number;
};

/** A suspect (and, for one of them, the culprit). */
export type MMCharacter = {
  id: string;
  name: string;
  /** Katakana / latin reading shown small under the name. */
  reading?: string;
  /** Role / title, e.g. "画商". */
  role: string;
  /** Short profile shown on the card (no alibi spoilers — those are testimony). */
  bio: string;
  /** Two-letter initials used as a portrait fallback. */
  initials: string;
  /** Order-dependent testimony, chosen at interrogation time. */
  statements: MMStatement[];
  isCulprit: boolean;
};

/** A discoverable piece of evidence. */
export type MMClue = {
  id: string;
  /** Short name shown on the evidence card. */
  title: string;
  /** Where it is found, e.g. "玄関". Used as the board label. */
  location: string;
  /** What the player learns on inspection. */
  text: string;
};

export type MMScenario = {
  /** URL slug. */
  id: string;
  title: string;
  reading?: string;
  tagline: string;
  players: string;
  duration: string;
  difficulty: MMDifficulty;
  /** Accent color (hex) — drives the scenario's theming. */
  color: string;
  /** Opening setup paragraphs (事件発生). */
  intro: string[];
  /** One-line victim summary shown in the case file. */
  victim: string;
  characters: MMCharacter[];
  clues: MMClue[];
  solution: {
    /** id of the culprit in `characters`. */
    culpritId: string;
    /** Reveal walkthrough, paragraph per entry. */
    explanation: string[];
  };
  endings: {
    /** Shown when the player accuses the right person. */
    correct: string[];
    /** Shown when the player accuses the wrong person. */
    wrong: string[];
  };
};

/** Live state the interrogation engine evaluates statements against. */
export type InterrogationState = {
  /** Suspect ids in the order they were first questioned. */
  questionedOrder: string[];
  /** Clue ids discovered so far. */
  discovered: string[];
  /** Topics unlocked by prior testimony. */
  topics: string[];
};

/**
 * Pick the line a suspect speaks given the current state. Highest-priority
 * matching statement wins; ties resolve to the earliest listed. Always returns
 * something (the last statement is treated as the fallback).
 */
export function chooseStatement(
  char: MMCharacter,
  state: InterrogationState,
): MMStatement {
  const idx = state.questionedOrder.indexOf(char.id);
  // A suspect keeps their original turn number when re-questioned.
  const order = idx >= 0 ? idx + 1 : state.questionedOrder.length + 1;

  const ok = (c?: MMCondition): boolean => {
    if (!c) return true;
    if (c.order != null && c.order !== order) return false;
    if (c.after && !c.after.every((id) => state.questionedOrder.includes(id)))
      return false;
    if (c.before && c.before.some((id) => state.questionedOrder.includes(id)))
      return false;
    if (c.clues && !c.clues.every((id) => state.discovered.includes(id)))
      return false;
    if (c.topics && !c.topics.every((t) => state.topics.includes(t)))
      return false;
    return true;
  };

  const candidates = char.statements.filter((s) => ok(s.when));
  candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return candidates[0] ?? char.statements[char.statements.length - 1];
}

export const SCENARIOS: MMScenario[] = [
  {
    id: "midnight-atelier",
    title: "真夜中のアトリエ",
    reading: "MIDNIGHT ATELIER",
    tagline: "雨の夜、画家はひとつの絵を遺して死んだ。",
    players: "1人用",
    duration: "約15分",
    difficulty: "NORMAL",
    color: "#2d4a6e",
    intro: [
      "六月の終わり、夜半から雨。",
      "画家・霧島玲（きりしま れい）は、自宅兼アトリエで倒れているところを発見された。机の角に頭を打ちつけたような傷。だが床に争った跡があり、事故とは思えない。",
      "止まった置き時計は 22:03 を指していた。その夜アトリエを訪れていたのは、三人。あなたは残された痕跡と証言から、真実を選び取らなければならない。",
    ],
    victim: "霧島 玲 — 画家。寡作だが熱狂的な蒐集家を持つ。死亡推定時刻は 22 時前後。",
    characters: [
      {
        id: "asakura",
        name: "朝倉 透",
        reading: "ASAKURA Tohru",
        role: "画商",
        initials: "AS",
        bio: "霧島の作品を一手に扱う画商。旧作の贋作疑惑で、損をかぶる立場にあった。",
        isCulprit: true,
        statements: [
          {
            // 七瀬より先に尋ねると、強気で押し通す。
            when: { before: ["nanase"] },
            priority: 1,
            text: "21時にはここを出たよ。それきり戻っていない。雨が降る前にね。",
          },
          {
            // 七瀬の証言→濡れた傘、の後だと崩れる。
            when: { after: ["nanase"], clues: ["umbrella"] },
            priority: 10,
            text: "……七瀬が、僕の傘のことを？ ばかな、あれは——（言葉が、途切れる）",
          },
          {
            // 七瀬の後だが、まだ傘を見ていなければ動揺だけ。
            when: { after: ["nanase"] },
            priority: 5,
            text: "七瀬は、何を言った？ ……僕は21時に帰った。それだけだ。（声が硬い）",
          },
          {
            text: "贋作だなんて、言いがかりだよ。霧島とは古い付き合いなんだ。",
          },
        ],
      },
      {
        id: "nanase",
        name: "七瀬 結",
        reading: "NANASE Yui",
        role: "モデル・弟子",
        initials: "NN",
        bio: "霧島のモデルを務めながら絵を学ぶ弟子。お酒は一滴も飲めない。",
        isCulprit: false,
        statements: [
          {
            // 最初に尋ねると、ぼんやりした違和感を口にする。
            when: { order: 1 },
            priority: 1,
            text: "21時すぎには自室に戻りました。……でも、玄関のほうで物音がした気がして。誰か、出入りしたのかも。",
            unlocks: ["saw-someone-return"],
          },
          {
            // 朝倉を先に尋ねた後だと、矛盾を指す方向へ。
            when: { after: ["asakura"] },
            priority: 8,
            text: "朝倉さん、もう帰ったと？ ……変ね。あの後、玄関の傘立てでまた音がしたのに。",
            unlocks: ["saw-someone-return"],
          },
          {
            text: "先生とはお茶を。お酒は飲めないんです、本当に、一滴も。",
          },
        ],
      },
      {
        id: "miyano",
        name: "宮野 冬吾",
        reading: "MIYANO Tohgo",
        role: "美術評論家・旧友",
        initials: "MY",
        bio: "霧島の学生時代からの友人で評論家。その夜は一階の客間にいた。",
        isCulprit: false,
        statements: [
          {
            when: { clues: ["radio"] },
            priority: 5,
            text: "客間でずっと原稿をね。ラジオ？ ああ、点けっぱなしだった。雨の予報は夜更けだったよ。",
          },
          {
            text: "一階の客間から動いていない。階段の音がすれば、気づいたはずだ。",
          },
        ],
      },
    ],
    clues: [
      {
        id: "umbrella",
        title: "濡れた傘",
        location: "玄関",
        text: "玄関の傘立てに、まだ雫の落ちる傘が一本。差してから間もない。来客用ではなく、たたみ方に癖がある——使い慣れた持ち主の傘だ。",
      },
      {
        id: "radio",
        title: "ラジオの天気",
        location: "客間",
        text: "つけっぱなしのラジオ。録音には『21時30分、にわか雨が降り始めました』のアナウンス。それ以前、街は乾いていた。",
      },
      {
        id: "glasses",
        title: "二客のワイングラス",
        location: "アトリエ",
        text: "倒れた机に、ワイングラスが二つ。どちらにも口紅の跡はない。一方には飲みかけの赤。霧島は誰かと——男と——杯を交わしていた。",
      },
      {
        id: "canvas",
        title: "描きかけの絵",
        location: "イーゼル",
        text: "イーゼルには未完の一枚。署名の上に、別人の筆跡で小さく『贋』の字。誰かが、この絵の真贋を巡って霧島と揉めていたことを示している。",
      },
      {
        id: "clock",
        title: "止まった時計",
        location: "床",
        text: "争いの拍子に倒れたらしい置き時計は 22:03 で停止。雨が降り始めた 21:30 より、確実に後の出来事だ。",
      },
    ],
    solution: {
      culpritId: "asakura",
      explanation: [
        "犯人は 朝倉 透。",
        "雨が降り始めたのは 21:30（ラジオ）。なのに玄関には〈濡れた傘〉があり、しかも来客用ではなく使い慣れた誰かの傘。つまり 21:30 以降に、外から“戻ってきた”人物がいる。",
        "朝倉だけが『21時に出て、戻っていない』と証言していた。雨に濡れた傘が、そのアリバイを真っ向から崩す。",
        "〈二客のワイングラス〉に口紅はなく、霧島は“男”と飲んでいた。七瀬は下戸で酒を飲まず、宮野は一階の客間にいた（ラジオも客間）。アトリエで霧島と杯を交わせたのは朝倉だけ。",
        "動機は〈描きかけの絵〉の贋作疑惑。損失を背負う朝倉は、真贋を巡る口論の末に霧島を突き飛ばした——22:03、時計が止まった。",
      ],
    },
    endings: {
      correct: [
        "あなたは濡れた傘を指し示した。朝倉の顔から、雨と同じ温度の色が引いていく。",
        "「……戻ったのは、絵のことを、もう一度だけ話そうと思って」。崩れたアリバイの前で、画商は静かに肩を落とした。",
        "雨はいつのまにか上がっている。未完の絵だけが、まだ誰かの手を待っていた。",
      ],
      wrong: [
        "あなたの告発に、その人は戸惑った顔を向けた。決定的な矛盾は、別の場所に残されていたはずだ。",
        "雨の音が、答え合わせをやり直せと囁いている。",
      ],
    },
  },
];

export function getScenario(id: string): MMScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const DIFFICULTY_LABEL: Record<MMDifficulty, string> = {
  EASY: "やさしい",
  NORMAL: "ふつう",
  HARD: "むずかしい",
};
