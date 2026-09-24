import {
    getVisitors,
    deleteVisitor,
    getProperties,
    initializeDatabase,
    getPropertyRequests,
    deletePropertyRequest,
    getStatuses,
    addCategory,
    updateCategory,
    deleteCategory
} from "./database.js";
import {
    loadProperties
} from "./property.js";


const propertyDetails = {};

const requestContainers = [

    document.getElementById("requestContainer"),

    document.getElementById("visitorRequestPageContainer")

];

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const expiredCount = document.getElementById("expiredCount");
const propertyCount = document.getElementById("propertyCount");


// ===========================
// Status Management
// ===========================

let editingStatusId = null;

const statusNameInput = document.getElementById("statusName");
const statusColorInput = document.getElementById("statusColor");
const statusColorValue = document.getElementById("statusColorValue");
const statusSaveBtn = document.getElementById("statusSaveBtn");
const statusCancelBtn = document.getElementById("statusCancelBtn");
const statusFormTitle = document.getElementById("statusFormTitle");
const statusList = document.getElementById("statusList");
const statusMessage = document.getElementById("statusMessage");

function setStatusMessage(message, isError = false) {
    if (!statusMessage) return;
    statusMessage.textContent = message || "";
    statusMessage.style.color = isError ? "#b91c1c" : "#6b7280";
}

function resetStatusForm() {
    editingStatusId = null;
    if (statusNameInput) statusNameInput.value = "";
    if (statusColorInput) statusColorInput.value = "#22c55e";
    if (statusColorValue) statusColorValue.textContent = "#22C55E";
    if (statusFormTitle) statusFormTitle.textContent = "Create Status";
    if (statusSaveBtn) statusSaveBtn.textContent = "Create Status";
    setStatusMessage("");
}

function beginEditStatus(status) {
    editingStatusId = status.id;
    statusNameInput.value = status.name;
    statusColorInput.value = status.color || "#22c55e";
    statusColorValue.textContent = (status.color || "#22c55e").toUpperCase();
    statusFormTitle.textContent = "Edit Status";
    statusSaveBtn.textContent = "Save Changes";
    setStatusMessage("");
    document.getElementById("statusPage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function renderStatuses() {
    if (!statusList) return;

    statusList.innerHTML = "<p>Loading statuses...</p>";

    try {
        const statuses = await getStatuses();

        if (!statuses.length) {
            statusList.innerHTML = "<p>No statuses found.</p>";
            return;
        }

        statusList.innerHTML = "";

        statuses.forEach(status => {
            const item = document.createElement("div");
            item.className = "status-item";

            item.innerHTML = `
                <span class="status-swatch" style="background:${status.color || "#999"}"></span>
                <div class="status-info">
                    <div class="status-name">${escapeHtml(status.name)}</div>
                    <div class="status-id">${escapeHtml(status.id)} · ${status.active ? "Active" : "Inactive"}</div>
                </div>
                <div class="status-actions">
                    <button type="button" class="status-edit">Edit</button>
                    <button type="button" class="status-delete">Delete</button>
                </div>
            `;

            item.querySelector(".status-edit").onclick = () => beginEditStatus(status);

            item.querySelector(".status-delete").onclick = async () => {
                const replacement = statuses.find(s => s.id !== status.id);

                if (!replacement) {
                    alert("You cannot delete the only status. Create another status first.");
                    return;
                }

                const ok = confirm(
                    `Delete "${status.name}"?\n\nUnits using this status will be moved to "${replacement.name}".`
                );

                if (!ok) return;

                try {
                    setStatusMessage("Deleting status...");
                    await deleteCategory(status.id, replacement.id);
                    resetStatusForm();
                    await renderStatuses();
                    await loadProperties();
                    setStatusMessage(`"${status.name}" deleted successfully.`);
                } catch (error) {
                    console.error("Delete status failed:", error);
                    setStatusMessage(error.message || "Failed to delete status.", true);
                }
            };

            statusList.appendChild(item);
        });
    } catch (error) {
        console.error("Load statuses failed:", error);
        statusList.innerHTML = `<p style="color:#b91c1c">${escapeHtml(error.message || "Failed to load statuses.")}</p>`;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (statusColorInput) {
    statusColorInput.addEventListener("input", () => {
        if (statusColorValue) {
            statusColorValue.textContent = statusColorInput.value.toUpperCase();
        }
    });
}

if (statusCancelBtn) {
    statusCancelBtn.onclick = resetStatusForm;
}

if (statusSaveBtn) {
    statusSaveBtn.onclick = async () => {
        const name = statusNameInput?.value.trim();
        const color = statusColorInput?.value;

        if (!name) {
            setStatusMessage("Enter a status name.", true);
            statusNameInput?.focus();
            return;
        }

        if (!color) {
            setStatusMessage("Choose a status color.", true);
            return;
        }

        statusSaveBtn.disabled = true;

        try {
            if (editingStatusId) {
                await updateCategory(editingStatusId, name, color);
                setStatusMessage(`"${name}" updated successfully.`);
            } else {
                await addCategory(name, color);
                setStatusMessage(`"${name}" created successfully.`);
            }

            resetStatusForm();
            await renderStatuses();
            await loadProperties();
        } catch (error) {
            console.error("Save status failed:", error);
            setStatusMessage(error.message || "Failed to save status.", true);
        } finally {
            statusSaveBtn.disabled = false;
        }
    };
}

// ===========================
// Dashboard
// ===========================

async function updateCards() {
    const visitors = await getVisitors();
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    pendingCount.textContent = visitors.length;
    approvedCount.textContent = visitors.filter(v => v.createdAt >= startOfToday).length;
    expiredCount.textContent = visitors.filter(v => v.createdAt >= now - 7 * 86400000).length;

    propertyCount.textContent =
        Object.keys(await getProperties()).length;

}

// ===========================
// Visitors
// ===========================

async function loadVisitors() {
    const visitors = await getVisitors();
    requestContainers.forEach(container => {
        if (!container) return;
        container.replaceChildren();

        if (!visitors.length) {
            const empty = document.createElement("h3");
            empty.textContent = "No visitors yet";
            container.appendChild(empty);
            return;
        }

        visitors.forEach(visitor => {
            const card = document.createElement("div");
            card.className = "request-card";
            card.innerHTML = `
                <h3>${escapeHtml(visitor.name)}</h3>
                <p><strong>Phone:</strong> ${escapeHtml(visitor.phone)}</p>
                <p><strong>Email:</strong> ${escapeHtml(visitor.email)}</p>
                <p><strong>City:</strong> ${escapeHtml(visitor.city || "-")}</p>
                <p><strong>Submitted:</strong> ${visitor.createdAt ? escapeHtml(new Date(visitor.createdAt).toLocaleString()) : "-"}</p>
                <button class="delete" type="button">Delete</button>
            `;
            card.querySelector(".delete").addEventListener("click", async () => {
                if (!confirm("Delete this visitor?")) return;
                await deleteVisitor(visitor.docId);
                await refreshVisitors();
            });
            container.appendChild(card);
        });
    });
}

async function refreshVisitors() {
    await Promise.all([updateCards(), loadVisitors()]);
}

window.addEventListener("visitor-added", () => {
    refreshVisitors().catch(error => console.error("Could not refresh visitors:", error));
});


// ===========================

async function refresh() {

    await refreshVisitors();

    await loadProperties();

    await renderStatuses();

    await loadPropertyRequests();

}

// ===========================

(async () => {

    if (window.__adminReady) {
        const allowed = await window.__adminReady;
        if (!allowed) return;
    }

    await initializeDatabase();

    await refresh();

})();

// Refresh dashboard counts only
setInterval(async () => {
    await updateCards();
}, 60000);

async function loadPropertyRequests() {

    const table =
        document.getElementById("propertyRequestTable");

    table.innerHTML = "";

    const requests =
        await getPropertyRequests();

    requests.forEach(request => {

        table.innerHTML += `

<tr>

<td>${request.visitorName}</td>

<td>${request.phone}</td>

<td>F${request.floor}</td>

<td>${request.property}</td>

<td>${request.unit}</td>

<td>${new Date(request.requestedAt).toLocaleString()}</td>

<td>

<button
class="reject"
onclick="deleteRequest('${request.docId}')">

Remove

</button>

</td>

</tr>

`;

    });

}
window.deleteRequest = async function (id) {

    if (!confirm("Remove Request?"))
        return;

    await deletePropertyRequest(id);

    loadPropertyRequests();

}
