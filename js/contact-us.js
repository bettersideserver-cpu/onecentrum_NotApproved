(() => {
  const config = contactConfig;
  const form = document.getElementById("contact-form");
  const status = document.getElementById("enquiry-status");
  const email = config.email.trim();
  const validEmail = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email);

  function addContactLink(elementId, text, href) {
    const link = document.createElement("a");
    link.textContent = text;
    link.href = href;
    document.getElementById(elementId).replaceChildren(link);
  }

  const phone = config.phone.trim();
  if (phone && /\d/.test(phone)) {
    const dial = (config.phoneDial || phone).replace(/[^+\d]/g, "");
    addContactLink("contact-phone", phone, `tel:${dial}`);
  }

  if (validEmail) {
    addContactLink("contact-email", email, `mailto:${email}`);
    document.getElementById("enquiry-submit").disabled = false;
    document.getElementById("enquiry-help").textContent =
      "Opens your email app with your enquiry ready to send. Fields marked * are required.";
  }

  if (config.address.trim()) {
    document.getElementById("contact-address").textContent = config.address.trim();
  }

  if (config.hours.trim()) {
    const hours = document.getElementById("contact-hours");
    hours.textContent = config.hours.trim();
    hours.hidden = false;
  }

  if (config.mapUrl.trim()) {
    try {
      const url = new URL(config.mapUrl);
      if (url.protocol === "https:") {
        const mapLink = document.getElementById("contact-map");
        mapLink.href = url.href;
        mapLink.hidden = false;
      }
    } catch {
      // Leave the optional directions link hidden if its URL is incomplete.
    }
  }

  const websites = document.getElementById("contact-websites");
  websites.replaceChildren();
  for (const address of config.websites || []) {
    try {
      const url = new URL(address);
      if (url.protocol !== "https:") continue;
      const link = document.createElement("a");
      link.href = url.href;
      link.textContent = url.hostname;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      if (websites.childNodes.length) websites.appendChild(document.createElement("br"));
      websites.appendChild(link);
    } catch {
      // Skip incomplete website URLs.
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validEmail || !form.reportValidity()) return;

    const data = new FormData(form);
    const name = data.get("name").trim();
    const message = data.get("message").trim();
    if (!name || !message) {
      status.textContent = "Please enter your name and a message.";
      document.getElementById(!name ? "enquiry-name" : "enquiry-message").focus();
      return;
    }

    const subject = `One Centrum enquiry: ${data.get("interest")}`;
    const body = [
      `Name: ${name}`,
      `Email: ${data.get("email").trim()}`,
      `Phone: ${data.get("phone").trim() || "Not provided"}`,
      `Interested in: ${data.get("interest")}`,
      "",
      message
    ].join("\r\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = "Your email draft is ready to open. Send it from your email app to complete your enquiry. If no app opens, email us at the address shown on this page.";
  });
})();
