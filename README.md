# ペス / pesu — リンクサイト

<https://pesu0328-gif.github.io/pesu-links/>

歌い手ペスのリンクページ。GitHub Pages で公開している静的サイト。

## さわるファイル

| ファイル | 何を変えるとき |
|---|---|
| `links.json` | リンクを足す・URLを変える |
| `i18n.json` | 肩書き・キャッチコピー・各言語の文言 |

この2つ以外は基本さわらない。編集して push すれば1〜2分でサイトに反映される。

`links.json` は **`url` が空文字の項目をサイトに表示しない。** ひな形だけ置いておいて、URLが決まったら入れれば出る。

## 自動で更新されるもの（手で触らない）

毎朝6時（JST）に GitHub Actions が YouTube チャンネルを見て、次の3つを書き換える。

| 対象 | 内容 |
|---|---|
| `latest.json` | 最新曲のIDとタイトル。YouTubeの「動画」タブの一番上を取る |
| `index.html` の `og:image` | SNSにURLを貼ったときのサムネ。最新曲のサムネになる |
| `icon.png` | プロフィール画像と favicon。YouTubeチャンネルのアイコンを512pxで取る |

Shorts は YouTube 側で別タブに分かれているため、切り抜きが最新曲として表示されることはない。

取得に失敗したときはファイルを書き換えずにジョブが失敗する。サイトは前回の内容のまま生き続け、GitHubから失敗通知メールが届く。

手動で走らせたいときは **Actions タブ → 「最新曲を取得」→ Run workflow**。

アイコンを YouTube と別のものにしたい場合は、`.github/workflows/latest-video.yml` の `AUTO_ICON` を `"false"` にして、自分で `icon.png` を置く。

## 手元で確認する

```bash
python3 -m http.server 8000
```

<http://localhost:8000> を開く。JSONを `fetch` で読んでいるので、`index.html` をダブルクリックして開いても動かない。
