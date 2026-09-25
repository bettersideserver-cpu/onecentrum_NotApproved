# Construction videos

The Construction Status page now plays videos hosted on YouTube. You do not
need to upload the original video files to GitHub. You may keep local copies
in this folder; `.gitignore` excludes them from new Git commits.

Open `js/construction-status.js` and update the `constructionVideos` list:

```js
const constructionVideos = [
  { title: "Site Progress", src: "https://www.youtube.com/watch?v=clzV9Kiy48w" },
  { title: "Get Together", src: "https://www.youtube.com/shorts/hwsPBhsF0U4" }
];
```

- Paste a YouTube watch, Shorts, youtu.be, or embed URL in `src`.
- Shorts links automatically use a vertical player.
- Keep videos Public or Unlisted and allow embedding in YouTube Studio.
- Preview through a local web server or your hosted website. Opening the HTML
  directly as a file can prevent YouTube from identifying the embedding site.
- Copy an entry to add another video, or remove an entry to remove its row.
- Leave `src` empty to display a "Video coming soon" placeholder.
- The order of entries is the order shown on the page.

Open the Construction Status button on `index.html` to view your updates.

Direct HTTPS video file URLs and local paths such as `./videos/september.mp4`
still work. Local paths are relative to `ConstructionStatus.html`, and filenames
must match exactly. To publish a local video through Git, first adjust the
`/videos/*` ignore rule; the file must fit GitHub's file-size limits.

The ignore rule does not remove files already committed to Git history. If
GitHub still rejects a push because of an earlier large-file commit, that
commit needs to be corrected. For browser uploads to GitHub, omit the local
video files manually.
