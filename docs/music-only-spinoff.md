# Music-only Spinoff — Design Doc

> 既存の yeoreum-space (multi-category) から **music 専用 + members / liked-by / cover の K-pop ファン要素なし** にスリム化した派生サイトの設計。

Status: **draft / pre-init**
Last updated: 2026-05-29

---

## 1. 目的とスコープ

### やりたいこと
- 個人の音楽アーカイブを、**音楽だけに集中した別ブランドの web サイト**として公開する。
- 既存の yeoreum-space は multi-category (music / books / films / perfume / games) + 推しメンバー (SEVENTEEN) 文脈を含むが、こちらはそれらを一切持たない、純粋に楽曲を聴く / 記録する場所。

### 含めないもの (明示的に除外)
| 領域                     | 理由                                       |
| ------------------------ | ------------------------------------------ |
| books / films / perfume / games | music 専用にする                    |
| `category` 概念全般      | 単一カテゴリなので不要                     |
| Members / Liked by / Cover | セブチ要素 (member registry, group, cover performance) を全削除 |
| ageLimit ゲート          | 香水のロックが無くなるので不要             |
| Posts (blog)             | MVP 外。必要になったら別途追加             |
| CuratedList              | MVP 外。Phase 2 で評価                     |

### 残す音楽要素
- Track 詳細 (title / artist / album / release / length / country / MV URL / Apple Music / Spotify)
- Audio features (KEY / Camelot / BPM / energy / danceability / ...)
- Lyric excerpt (原文 + 日本語訳)
- Recommendation tags (#chill #late-night ...)
- Moods / Scenes (両方とも music にも貼れている運用なので継承)
- Music genres (master + 階層)
- Similar songs (curated + サジェスト)
- COLOR テーマ (カバー画像から抽出 → パレット最近傍)
- Sample images (MV スクショ等)

---

## 2. ブランド候補

ヒアリング用のたたき台。いずれも yeoreum-space の "season / quiet / paper" な情緒を維持しつつ、聴く行為に寄せている。

| 候補               | 由来 / 雰囲気                                                |
| ------------------ | ------------------------------------------------------------ |
| **cheongeum / 청음** | 韓国語で「聴く / 試聴」。yeoreum (여름) と韻が踏める        |
| **late piano**     | 既存フォームの placeholder。深夜の静かなリスニング           |
| **midnight signal**| 同 placeholder 由来。夜のラジオ的な情緒                      |
| **after light**    | 日が落ちた後の余白。落ち着いた色とフィットしやすい          |
| **second listen**  | 何度も聴き返すという行為そのものをブランド名にする           |

→ 1 つ仮で選んで、URL / ロゴ / 配色を後段で詰める。本ドキュメントでは仮称 **`music-site`** と表記。

---

## 3. 全体アーキテクチャ

### リポジトリ構成
```
yeoreum-space/             (既存) multi-category public
yeoreum-space-admin/       (既存) multi-category admin
music-site/                (新規) music-only public          ← 本ドキュメントの対象
music-site-admin/          (新規) music-only admin           ← 本ドキュメントの対象
```

既存 2 つは **参照実装** として残す。新規 2 つは独立した Next.js プロジェクト。

### Supabase
- **独立した Supabase プロジェクトを新規作成**する (yeoreum-space と DB を共有しない)。
- 同期は無し。データは新サイトでゼロから入力するか、既存 DB から `category='music'` の行だけ手で seed する。
- RLS / auth 構成は既存 admin と同じパターンで再現する。

### 技術スタック
- **Next.js 16** App Router (`node_modules/next/dist/docs/` を必ず参照、現代の Next.js とは API が違う)
- **Tailwind v4** (arbitrary values + CSS multi-column を活用)
- **Supabase** (Postgres + Storage + RLS)
- **TypeScript** strict
- デプロイは Vercel を想定 (既存と同様)

---

## 4. データモデル

multi-category 版から **category 列を削除**、**meta JSON を MusicMeta 単一型**に固定、**members 関連テーブルを全削除**。

### tracks (旧 items)
```sql
create table tracks (
  id            text primary key,                  -- 人間可読 ID, 例 "T-018"
  title         text not null,                     -- 公開タイトル
  title_sub     text,                              -- 別表記
  title_sub_public boolean default false,
  artist        text not null,                     -- アーティスト名 (英)
  artist_katakana text,                            -- 任意のカタカナ表記
  image_url     text,                              -- カバー (Supabase Storage)
  added_at      date not null,
  note          text,                              -- ノート (なぜ残ったか)
  meta          jsonb,                             -- MusicMeta (下記)
  color         text,                              -- パレット hex ("#4a5d6e")
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### MusicMeta (jsonb の内容)
```ts
type MusicMeta = {
  album?: string;
  releaseDate?: string;           // yyyy-mm-dd
  genre?: string;                 // comma-separated, music_genres.label 参照
  length?: string;                // "mm:ss"
  country?: string;               // "KR", "JP", ...
  mvUrl?: string;
  samples?: string[];             // up to 4
  appleMusicUrl?: string;
  spotifyUrl?: string;
  lyricExcerpt?: { original: string; japanese?: string };
  playlistNoteUrl?: string;
  recommendation?: string;        // "#chill, #night" の自由形式
  musicalKey?: string;            // "D# Minor"
  camelot?: string;               // "8A"
  bpm?: number;
  audioFeatures?: AudioFeatures;  // 0-100 + loudness dB
};
```

> ⚠️ `cover`, `likedBy`, `likedByGroup` フィールドは **持たない**。

### マスター系
```sql
create table moods (
  slug        text primary key,
  label       text not null,
  bg          text not null,    -- "#a3b8c5" など hex
  tone        text not null,    -- "light" | "dark"
  tagline     text,
  sort_order  int default 0
);

create table scenes (
  slug        text primary key,
  label       text not null,
  sort_order  int default 0
);

create table music_genres (
  label         text primary key,
  parent_label  text references music_genres(label),
  sort_order    int default 0,
  description   text,
  representative_songs jsonb default '[]'::jsonb
);
```

### 関連テーブル
```sql
create table track_moods  (track_id text references tracks(id) on delete cascade,
                            mood_slug text references moods(slug),
                            primary key (track_id, mood_slug));
create table track_scenes (track_id text references tracks(id) on delete cascade,
                            scene_slug text references scenes(slug),
                            primary key (track_id, scene_slug));
create table track_similars(a_id text references tracks(id) on delete cascade,
                            b_id text references tracks(id) on delete cascade,
                            primary key (a_id, b_id));
```

### 削除したテーブル
- `members` (member registry)
- `item_likes` / `cover` 系 — meta 内に残ってない (上記 MusicMeta から外している)
- `posts` / `curated_lists` / `category_*` — MVP 外

### RLS 方針
- `tracks` / マスター系 = 公開読み取り可、書き込みは `owner_email()` 関数で admin のみ。
- パターンは既存 admin の `supabase/migrations/20260529040000_rls_fix_owner_email.sql` を踏襲。

---

## 5. ルート構成 (公開サイト)

```
/                         トップ — 最近追加 + Mood ピックアップ
/tracks                   全曲一覧 (ID 降順 / フィルタ)
/tracks/[id]              曲詳細
/artists/[slug]           アーティストページ (集計表示)
/moods                    Mood 一覧 (チップグリッド)
/moods/[slug]             その Mood の曲一覧
/scenes                   Scene 一覧
/scenes/[slug]            その Scene の曲一覧
/genres                   Music genre 一覧 (3 階層)
/genres/[label]           そのジャンルの曲
/search                   サイト内検索
/palette                  COLOR パレットギャラリー (今後追加予定)
```

### admin ルート (slim 版)
```
/                    Track 一覧
/items/new           新規登録
/items/[id]/edit     編集
/moods               Mood 管理
/scenes              Scene 管理
/music-genres        Genre 管理 (3 階層 + 代表曲)
```

> **無くなるページ**: `/members` (member 管理), カテゴリ別ダッシュボード, 香水/書籍/映画/ゲーム関連の一覧。

---

## 6. 詳細ページ仕様 (`/tracks/[id]`)

既存 `c:\Users\shira\yeoreum-space\src\components\details\music-detail.tsx` を **ベース**にして、以下を **削除**する:

| 削除 | 既存ファイル該当                              |
| ---- | --------------------------------------------- |
| Cover タブ                  | `CoverSection`, `cover.videoUrl`, `cover.members` 関連 |
| Liked by                    | `LikedBy`, `Avatar`, `memberMap` 取得         |
| MusicTabs の `counts.cover` / `counts.liked` | タブ自体を Tracks / Lyric / Similar 3 枚に減らす |

残るタブ案: **Info / Lyric / Similar** の 3 つ。

レイアウト:
- **モバイル**: YouTube → Title Block → タブ → 下部スライドショー (samples) — COLOR で着色 (`withAlpha(color, 0.35)`)
- **デスクトップ**: 2-3 col グリッド (YouTube / ジャケット+メタ / タイトル)

---

## 7. コンポーネント移植マップ

### そのまま流用
| 既存パス                                  | 用途                          |
| ----------------------------------------- | ----------------------------- |
| `components/image-placeholder.tsx`        | カバー無し時のフォールバック  |
| `components/mood-chip.tsx`                | Mood チップ                   |
| `components/item-card-small.tsx`          | カード (リネーム → `track-card.tsx`) |
| `components/details/music-detail.tsx`     | 詳細ベース (Cover / Liked-by 削除) |
| `lib/youtube.ts`                          | YouTube ID 抽出               |
| `lib/format.ts` / `lib/country.ts`        | 日付 / 国旗                   |
| `lib/music-color-palette.ts`              | COLOR パレット (両 repo にコピー済) |
| `lib/db/moods.ts` / `genres.ts` / `scenes.ts` | DB アクセスの形だけ流用    |
| `lib/age-verify.ts` / `lib/item-lock.ts`  | ❌ 削除 (ageLimit 廃止)       |

### 改修して流用
| 既存                          | 改修点                              |
| ----------------------------- | ----------------------------------- |
| `lib/types.ts`                | `Category`, `CATEGORY_META`, `Item.category`, perfume/book/film/games meta, `Member`, `LikedByPerson` を全削除。`Track` 型に rename |
| admin の `item-form.tsx`      | category 分岐を全部抜く、音楽の Field だけ残す |
| admin の `items-table.tsx`    | カテゴリ列削除、ID 降順固定         |
| admin の `members-manager.tsx`| ❌ 削除                              |

### 新規追加 (Phase 2)
- `/palette` ページ (パレット閲覧)
- artist のページ集計 (artist 名 → 曲一覧 + 国旗 + 平均 BPM 等)

---

## 8. 初期セットアップ手順

### 8.1 リポジトリ作成
```bash
# 公開サイト
cd c:/Users/shira
npx create-next-app@latest music-site --typescript --tailwind --app --no-src-dir=false
cd music-site
npm i @supabase/supabase-js @supabase/ssr lucide-react

# admin (公開サイトと同等の構成で並列に作成)
cd ..
npx create-next-app@latest music-site-admin --typescript --tailwind --app
```

> ⚠️ Next.js 16 はトレーニング知識と挙動が違う API がある。実装前に必ず `node_modules/next/dist/docs/` の該当ガイドを読む。

### 8.2 環境変数
両プロジェクトに `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OWNER_EMAIL=shirata.sayaka@gmail.com
```

### 8.3 Supabase 初期化
新規プロジェクトを作成し、以下の順でマイグレーションを当てる:
1. `owner_email()` 関数 + RLS helper
2. `tracks` テーブル
3. `moods` / `scenes` / `music_genres` マスター
4. 関連テーブル (`track_moods` / `track_scenes` / `track_similars`)
5. Storage バケット: `track-covers`, `track-samples`
6. RLS policy 適用

参照: 既存 `yeoreum-space-admin/supabase/migrations/*.sql`

### 8.4 デザイントークン
既存サイトの CSS 変数 (`--color-paper`, `--color-ink`, `--color-cream` ...) は引き継ぎたい場合のみコピーする。別ブランドなので**配色は刷新する想定**。最低限:
- paper / ink / line / cream の 4 系統
- music アクセント色 (1 つだけ)
- 既存の `MUSIC_COLOR_PALETTE` (22 色) は変更せず流用 OK

---

## 9. Phase 計画

### Phase 0 — 設計確定 (このドキュメント)
- ブランド名決定
- 配色 / ロゴラフ

### Phase 1 — 公開サイト MVP (2-3 日想定)
- Next.js / Supabase / Tailwind 雛形
- `/` トップと `/tracks/[id]` 詳細
- Moods マスター + 関連表示
- COLOR テーマ反映

### Phase 2 — 管理画面 MVP
- 既存 admin から `item-form.tsx` をコピー → music-only にスリム化
- tracks 一覧 + 編集
- Apple Music サーチ流用

### Phase 3 — マスター管理
- Moods / Scenes / Music genres の admin ページ移植

### Phase 4 — 拡張
- Similar songs (curated + サジェスト)
- /palette ページ
- /artists/[slug]
- 検索

### Phase 5 (任意)
- CuratedList (プレイリスト)
- Posts (blog)

---

## 10. 既存実装からの差分チェックリスト

新リポジトリで実装する際、**既存コードをそのままコピーすると K-pop ファン要素を持ち込む**ので注意:

- [ ] `Item.category`, `CATEGORY_META` を import していないか
- [ ] `Member`, `LikedByPerson`, `getMemberMap` の参照がゼロか
- [ ] `MusicMeta.cover` / `MusicMeta.likedBy` / `MusicMeta.likedByGroup` を削除したか
- [ ] `members-manager.tsx`, `MemberAutocomplete` を移植していないか
- [ ] 詳細ページの `MusicTabs` から cover / liked タブを削除したか
- [ ] CSS 変数 `--color-cat-*` (カテゴリ別アクセント) を削除したか
- [ ] `ageLimit` / `isItemLocked` を持ち込んでいないか

---

## Appendix A — 既存リファレンス

このスピンオフを作る上で読み返すと早いファイル:

- 型: `yeoreum-space/src/lib/types.ts`
- DB アクセス: `yeoreum-space/src/lib/db/{items,moods,scenes}.ts`
- 公開詳細: `yeoreum-space/src/components/details/music-detail.tsx`
- 管理フォーム: `yeoreum-space-admin/src/components/item-form.tsx`
- マイグレーション: `yeoreum-space-admin/supabase/migrations/*.sql`
- COLOR パレット: `yeoreum-space/src/lib/music-color-palette.ts`

---

## Appendix B — Open questions

仕様確定が必要な項目:

1. **ブランド名** (§2 から選択)
2. **配色を引き継ぐか刷新するか**
3. **Scene を残すか** — 「失恋 / 後悔」等の感情タグ。music にも貼れているので継承候補だが、用途が薄いなら省く
4. **Curated lists を MVP に入れるか**
5. **既存 DB から music 行を一括 export して seed するか、ゼロからやり直すか**
6. **Posts (blog) は別ブランドでも書くのか**
