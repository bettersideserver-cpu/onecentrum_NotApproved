import {
    addVisitor,
    getProperties,
    getCategories,
    initializeDatabase,
    listenProperties,
    addPropertyRequest
} from "./database.js";
import { updateFloorColors } from "./floorColor.js";

const popup = document.getElementById("popup");
const visitorForm = document.getElementById("visitorForm");
const floor = document.getElementById("floorWrapper");
const legend = document.getElementById("legend");
const tooltip = document.getElementById("tooltip");
const cityInput = document.getElementById("city");
const citySuggestions = document.getElementById("citySuggestions");
const formMessage = document.getElementById("visitorFormMessage");
const submitButton = visitorForm?.querySelector('button[type="submit"]');
const SESSION_KEY = "registeredVisitor";
const HOME_URL = "../../../index.html";

function getSavedVisitor() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function showRegistration() {
    if (popup) popup.style.display = "flex";
}

function hideRegistration() {
    if (popup) popup.style.display = "none";
}

visitorForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    submitButton.disabled = true;
    if (formMessage) formMessage.textContent = "Saving your details...";

    try {
        const visitor = await addVisitor(
            document.getElementById("name").value.trim(),
            document.getElementById("phone").value.trim(),
            document.getElementById("email").value.trim(),
            cityInput?.value.trim() || ""
        );

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(visitor));
        hideRegistration();

        const target = sessionStorage.getItem("pendingFloorRedirect");
        sessionStorage.removeItem("pendingFloorRedirect");
        if (target) window.location.href = target;
    } catch (error) {
        console.error("Visitor registration failed:", error);
        if (formMessage) formMessage.textContent = "Could not save your details. Please try again.";
    } finally {
        submitButton.disabled = false;
    }
});

window.requestFloorAccess = function (targetUrl) {
    if (getSavedVisitor()) {
        window.location.href = targetUrl;
    } else {
        sessionStorage.setItem("pendingFloorRedirect", targetUrl);
        showRegistration();
    }
};

const cities = [
    "Amritsar", "Barnala", "Batala", "Bathinda", "Chandigarh", "Faridkot",
    "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur",
    "Jalandhar", "Kapurthala", "Khanna", "Kharar", "Kotkapura", "Ludhiana",
    "Malerkotla", "Mansa", "Moga", "Mohali", "Muktsar", "Nabha",
    "Nawanshahr", "Pathankot", "Patiala", "Rajpura", "Rupnagar", "Samrala",
    "Sangrur", "Sirhind", "Sunam", "Zirakpur"
];

cityInput?.addEventListener("input", () => {
    if (!citySuggestions) return;
    const query = cityInput.value.trim().toLowerCase();
    citySuggestions.replaceChildren();

    for (const city of cities.filter(item => item.toLowerCase().includes(query) && query)) {
        const option = document.createElement("div");
        option.className = "city-item";
        option.textContent = "📍 " + city;
        option.addEventListener("click", () => {
            cityInput.value = city;
            citySuggestions.style.display = "none";
        });
        citySuggestions.appendChild(option);
    }

    citySuggestions.style.display = citySuggestions.childElementCount ? "block" : "none";
});

document.addEventListener("click", event => {
    if (citySuggestions && event.target !== cityInput && !citySuggestions.contains(event.target)) {
        citySuggestions.style.display = "none";
    }
});

let properties = {};
let categories = {};
let selectedUnit = null;
let selectedInfo = null;

const isMobileUnitInteraction = () =>
    window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;

function showUnitTooltip(unit, event) {
    if (!tooltip) return;

    const status = properties[unit.id]?.status || "Unknown";
    const info = window.unitDetails?.[unit.id];
    const x = Math.min(
        (event.clientX || window.innerWidth / 2) + 12,
        window.innerWidth - Math.min(300, window.innerWidth * 0.8) - 10
    );
    const y = Math.min((event.clientY || window.innerHeight / 2) + 12, window.innerHeight - 170);

    tooltip.style.display = "block";
    tooltip.style.left = Math.max(10, x) + "px";
    tooltip.style.top = Math.max(10, y) + "px";
    tooltip.style.pointerEvents = isMobileUnitInteraction() ? "auto" : "none";

    const statusColor = categories[status] || "#999";
    tooltip.innerHTML = `
        <strong>${unit.id.replace(/_x5F_/g, " ").replace(/_/g, " ")}</strong>
        ${info ? `<br>Super Area : ${info.superArea}<br>Carpet Area : ${info.carpetArea}` : ""}
        <br>Status : <span style="color:${statusColor};font-weight:700;">${status}</span>
        ${status === "Available" ? '<br><br><button type="button" class="holdBtn">Request to Hold</button>' : ""}
    `;

    tooltip.querySelector(".holdBtn")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openHoldRequest(unit);
    });
}

function openHoldRequest(unit) {
    selectedUnit = unit.id;
    selectedInfo = window.unitDetails?.[unit.id];
    const holdPopup = document.getElementById("holdPopup");
    const propertyName = document.getElementById("holdPropertyName");
    if (!holdPopup) {
        alert("Hold request is still loading. Please try again.");
        return;
    }
    if (propertyName) propertyName.textContent = selectedInfo?.unit || unit.id;
    if (tooltip) tooltip.style.display = "none";
    holdPopup.style.display = "flex";
}

document.querySelectorAll(".unit").forEach(unit => {
    unit.addEventListener("mousemove", event => {
        if (!isMobileUnitInteraction()) showUnitTooltip(unit, event);
    });
    unit.addEventListener("mouseleave", () => {
        if (!isMobileUnitInteraction() && tooltip) tooltip.style.display = "none";
    });
    unit.addEventListener("click", event => {
        if (properties[unit.id]?.status !== "Available") {
            alert("This property is not available.");
            return;
        }
        if (isMobileUnitInteraction()) showUnitTooltip(unit, event);
        else openHoldRequest(unit);
    });
});

document.addEventListener("click", event => {
    if (isMobileUnitInteraction() && tooltip?.style.display === "block" &&
        !tooltip.contains(event.target) && !event.target.closest(".unit")) {
        tooltip.style.display = "none";
    }
});

document.addEventListener("click", async event => {
    const holdNo = event.target.closest("#holdNo");
    const holdYes = event.target.closest("#holdYes");
    if (!holdNo && !holdYes) return;

    const holdPopup = document.getElementById("holdPopup");
    if (holdNo) {
        if (holdPopup) holdPopup.style.display = "none";
        return;
    }

    const visitor = getSavedVisitor();
    if (!visitor) {
        alert("Please register first.");
        showRegistration();
        if (holdPopup) holdPopup.style.display = "none";
        return;
    }

    try {
        await addPropertyRequest({
            visitorId: visitor.id,
            visitorName: visitor.name,
            phone: visitor.phone,
            email: visitor.email,
            city: visitor.city,
            propertyId: selectedUnit,
            property: selectedInfo?.unit || selectedUnit,
            floor: selectedUnit.split("_")[0],
            unit: selectedUnit.split("_").pop(),
            status: "Pending",
            requestedAt: Date.now()
        });
        if (holdPopup) holdPopup.style.display = "none";
        alert("Property request sent successfully.");
    } catch (error) {
        console.error("Property request failed:", error);
        alert("Could not send the property request. Please try again.");
    }
});

async function showFloor() {
    if (floor) floor.style.display = "block";
    if (legend) {
        legend.replaceChildren();
        for (const [name, color] of Object.entries(categories)) {
            const item = document.createElement("div");
            item.className = "legend-item";
            const swatch = document.createElement("span");
            swatch.className = "legend-color";
            swatch.style.background = color;
            item.append(swatch, document.createTextNode(name));
            legend.appendChild(item);
        }
    }
    await updateFloorColors();
}

(async () => {
    if (!popup && !getSavedVisitor()) {
        window.location.replace(HOME_URL);
        return;
    }

    if (popup) {
        if (getSavedVisitor()) hideRegistration();
        else showRegistration();
    }

    try {
        await initializeDatabase();
        properties = await getProperties();
        categories = await getCategories();
        await showFloor();
        listenProperties(async data => {
            properties = data;
            await updateFloorColors(properties);
        });
    } catch (error) {
        console.error("Could not load property inventory:", error);
    }
})();
