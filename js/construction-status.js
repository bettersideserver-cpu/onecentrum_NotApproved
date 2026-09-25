// Edit the titles and paste YouTube watch, Shorts, or youtu.be links here.
// Local files ("./videos/september.mp4") and direct video URLs also work.
// Copy an entry to add more videos. Empty src values show "Video coming soon".
const constructionVideos = [
  { title: "Ferozepur Road has always set city’s Standard", src: "https://www.youtube.com/watch?v=clzV9Kiy48w" },
  { title: "Construction - July OC updated final", src: "https://www.youtube.com/watch?v=Bc2iUHvH_as" },
  { title: "Land Construction Update", src: "https://www.youtube.com/watch?v=FhPEWdp8cfs" },
  { title: "Get Together", src: "https://www.youtube.com/shorts/hwsPBhsF0U4" }
];

function getYouTubeVideo(src) {
  try {
    const url = new URL(src);
    if (!["https:", "http:"].includes(url.protocol)) return null;

    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    let id;

    if (host === "youtu.be") {
      id = parts[0];
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com",
      "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      id = parts[0] === "watch"
        ? url.searchParams.get("v")
        : ["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null;
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id || "")
      ? { id, portrait: parts[0] === "shorts" }
      : null;
  } catch {
    return null;
  }
}

const updates = document.getElementById("construction-updates");
const rowTemplate = document.getElementById("video-row-template");

constructionVideos.forEach((entry, index) => {
  const row = rowTemplate.content.cloneNode(true);
  const title = row.querySelector(".video-title");
  const video = row.querySelector("video");
  const placeholder = row.querySelector(".video-placeholder");
  const src = entry.src.trim();
  const youtube = getYouTubeVideo(src);
  const titleId = `construction-video-${index + 1}`;

  title.id = titleId;
  title.textContent = entry.title;
  row.querySelector("article").setAttribute("aria-labelledby", titleId);
  row.querySelector(".update-number").textContent = String(index + 1).padStart(2, "0");
  video.setAttribute("aria-labelledby", titleId);

  if (youtube) {
    const frame = row.querySelector(".video-frame");
    const player = document.createElement("iframe");
    player.title = entry.title;
    player.loading = index === 0 ? "eager" : "lazy";
    player.referrerPolicy = "strict-origin-when-cross-origin";
    player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    player.allowFullscreen = true;
    player.src = `https://www.youtube.com/embed/${youtube.id}?rel=0&playsinline=1`;
    frame.classList.add("is-youtube");
    frame.classList.toggle("is-portrait", youtube.portrait);
    frame.replaceChildren(player);

  } else if (src) {
    video.addEventListener("error", () => {
      video.hidden = true;
      placeholder.hidden = false;
      placeholder.querySelector(".video-message").textContent =
        "This video is currently unavailable. Please try again later.";
    });

    // Keep only one locally hosted update playing at a time.
    video.addEventListener("play", () => {
      updates.querySelectorAll("video").forEach(other => {
        if (other !== video) other.pause();
      });
    });

    video.src = src;
    video.hidden = false;
    placeholder.hidden = true;
  }

  updates.appendChild(row);
});

if (constructionVideos.length === 0) {
  const message = document.createElement("p");
  message.className = "empty-message";
  message.textContent = "Construction videos are coming soon.";
  updates.appendChild(message);
}
