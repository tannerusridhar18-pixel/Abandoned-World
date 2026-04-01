/* ================= CONFIGURATION ================= */
const API = "http://localhost:8081/api";
const LOGIN_PAGE = "login.html";

/* ================= STATE MANAGEMENT ================= */
let currentTab = 'reviews';
let userData = null;
let reviewsData = [];

/* ================= TOKEN MANAGEMENT ================= */
function getToken() {
    const t = localStorage.getItem("jwtToken");
    if (!t || t === "undefined" || t === "null") {
        window.location.href = LOGIN_PAGE;
        return null;
    }
    return t;
}

function authHeaders() {
    return { "Authorization": `Bearer ${getToken()}` };
}

/* ================= INITIALIZATION ================= */
document.addEventListener("DOMContentLoaded", () => {
    if (!getToken()) return;
    initializeApp();
});

async function initializeApp() {
    showLoading();

    try {
        setupEventListeners();
        await loadProfile();
        await loadReviews();
        loadActivity();
        loadFavorites();
        loadPhotos();
    } catch (error) {
        console.error("Initialization error:", error);
        showToast("Failed to load profile data", "error");
    } finally {
        hideLoading();
    }
}

/* ================= EVENT LISTENERS ================= */
function setupEventListeners() {
    const menuIcon = document.getElementById("menuIcon");
    const dropdown = document.getElementById("dropdownMenu");

    if (menuIcon && dropdown) {
        menuIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        });
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !menuIcon.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    setupPhotoUpload();

    const bioInput = document.getElementById('editBio');
    if (bioInput) {
        bioInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('bioCount').textContent = count;
            if (count > 500) e.target.value = e.target.value.substring(0, 500);
        });
    }

    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    }

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            dropdown?.classList.remove('active');
        }
    });
}

/* ================= PHOTO UPLOAD ================= */
function setupPhotoUpload() {
    // Profile photo
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            showLoading();
            try {
                const res = await fetch(`${API}/users/upload-photo`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: formData
                });

                if (!res.ok) throw new Error("Upload failed");

                const data = await res.json();
                document.getElementById('profileImage').src = data.imageUrl;
                showToast("Profile photo updated!", "success");
            } catch (err) {
                console.error(err);
                showToast("Failed to upload photo", "error");
            } finally {
                hideLoading();
            }
        });
    }

    // Cover photo
    const coverInput = document.getElementById('coverInput');
    if (coverInput) {
        coverInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            showLoading();
            try {
                const res = await fetch(`${API}/users/upload-cover`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: formData
                });

                if (!res.ok) throw new Error("Upload failed");

                const data = await res.json();
                document.getElementById('coverPhoto').style.backgroundImage = `url(${data.imageUrl})`;
                showToast("Cover photo updated!", "success");
            } catch (err) {
                console.error(err);
                showToast("Failed to upload cover", "error");
            } finally {
                hideLoading();
            }
        });
    }
}

/* ================= UTILITY FUNCTIONS ================= */
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function readResponseMessage(response) {
    try {
        const body = await response.json();
        return body.message || "Request failed";
    } catch {
        return "Request failed";
    }
}

function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ================= LOADING STATE ================= */
function showLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.add('active');
    }
}

function hideLoading() {
    console.log("Loader hidden called");

    const loader = document.getElementById('loadingOverlay');

    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            loader.remove();
        }, 300); 

        // 🔥 FORCE FIX (important)
        loader.style.display = "none";
    }
}

/* ================= TOAST NOTIFICATIONS ================= */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    const messageEl = document.getElementById('toastMessage');

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };

    icon.className = `fas ${icons[type] || icons.success}`;
    icon.style.color = colors[type] || colors.success;
    messageEl.textContent = message;

    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

/* ================= LOAD PROFILE ================= */
async function loadProfile() {
    try {
        const res = await fetch(`${API}/users/me`, { headers: authHeaders() });

        if (res.status === 401 || res.status === 403) { logout(); return; }
        if (!res.ok) throw new Error(await readResponseMessage(res));

        userData = await res.json();

        document.getElementById("username").textContent =
            userData.name || userData.username || userData.email || "Unknown User";
        document.getElementById("userHandle").textContent =
            userData.username ? `@${userData.username}` : "@username";
        document.getElementById("email").innerHTML =
            `<i class="fas fa-envelope"></i> ${escapeHtml(userData.email || "")}`;
        document.getElementById("bio").textContent =
            userData.bio || "No bio added yet. Tell us about yourself!";
        document.getElementById("joinDate").innerHTML =
            `<i class="fas fa-calendar"></i> Joined ${formatDate(userData.joinDate)}`;

        document.getElementById("profileImage").src =
            userData.profileImageUrl || "../images/imga.png";

        if (userData.coverImageUrl) {
            document.getElementById("coverPhoto").style.backgroundImage =
                `url(${userData.coverImageUrl})`;
        }

        document.getElementById("reviewCount").textContent  = userData.reviewCount  ?? 0;
        document.getElementById("likesCount").textContent   = userData.likesCount   ?? 0;
        document.getElementById("photosCount").textContent  = userData.photosCount  ?? 0;
        document.getElementById("placesCount").textContent  = userData.placesCount  ?? 0;

    } catch (error) {
        console.error("Profile load failed:", error);
        showToast("Failed to load profile", "error");
    }
}

/* ================= TAB SWITCHING ================= */
function switchTab(tabName) {
    currentTab = tabName;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

/* ================= LOAD REVIEWS ================= */
async function loadReviews() {
    const container = document.getElementById("reviewsContainer");

    try {
        const sortBy = document.getElementById('sortReviews')?.value || 'recent';

        // Uses the fixed /api/reviews/my endpoint which now returns placeName
        const res = await fetch(`${API}/reviews/my?sort=${sortBy}`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        reviewsData = await res.json();

        if (!Array.isArray(reviewsData) || reviewsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-slash"></i>
                    <h3>No Reviews Yet</h3>
                    <p>Start exploring and share your experiences!</p>
                </div>
            `;
            return;
        }

        displayReviews(reviewsData);

    } catch (error) {
        console.error("Review load failed:", error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Reviews</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

function displayReviews(reviews) {
    const container = document.getElementById("reviewsContainer");

    container.innerHTML = reviews.map(r => {
        const rating = Number(r.rating) || 0;
        const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

        return `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <h3>${escapeHtml(r.placeName || "Unknown Place")}</h3>
                        <div class="rating">${stars} <span class="rating-text">${rating}/5</span></div>
                    </div>
                    <span class="review-date">${formatDate(r.createdAt)}</span>
                </div>
                <p class="review-text">${escapeHtml(r.comment || "No comment provided")}</p>
                <div class="review-meta">
                    <div class="review-stats">
                        <span><i class="fas fa-heart"></i> ${r.likes || 0}</span>
                        <span><i class="fas fa-eye"></i> ${r.views || 0}</span>
                    </div>
                    <div class="review-actions">
                        <button onclick="editReview('${r.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteReview('${r.id}')" class="delete-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function filterReviews() {
    const searchTerm = document.getElementById('searchReviews').value.toLowerCase();
    const filtered = reviewsData.filter(review =>
        review.placeName?.toLowerCase().includes(searchTerm) ||
        review.comment?.toLowerCase().includes(searchTerm)
    );
    displayReviews(filtered);
}

/* ================= DELETE REVIEW ================= */
async function deleteReview(id) {
    if (!confirm("Delete this review? This action cannot be undone.")) return;

    showLoading();
    try {
        const res = await fetch(`${API}/reviews/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        showToast("Review deleted successfully", "success");
        await loadReviews();
        await loadProfile();

    } catch (error) {
        console.error("Delete failed:", error);
        showToast("Failed to delete review", "error");
    } finally {
        hideLoading();
    }
}

function editReview(id) {
    showToast("Edit review feature coming soon!", "info");
}

/* ================= LOAD ACTIVITY ================= */
async function loadActivity() {
    const container = document.getElementById("activityContainer");

    try {
        const res = await fetch(`${API}/users/activity`, { headers: authHeaders() });

        if (!res.ok) throw new Error("Activity load failed");

        const activities = await res.json();
        container.innerHTML = "";

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>No Activity Yet</h3>
                    <p>Your activity will appear here</p>
                </div>`;
            return;
        }

        activities.forEach(a => {
            const div = document.createElement("div");
            div.className = "activity-item";
            div.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${a.type === 'Review' ? 'fa-comment' : 'fa-heart'}"></i>
                </div>
                <div class="activity-details">
                    <p>${escapeHtml(a.description || a.type)}</p>
                    <span class="activity-time">${formatDate(a.createdAt)}</span>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error("Activity error:", err);
        const container = document.getElementById("activityContainer");
        container.innerHTML = `<div class="empty-state"><p>Could not load activity</p></div>`;
    }
}

/* ================= LOAD FAVORITES ================= */
async function loadFavorites() {
    const container = document.getElementById("favoritesContainer");

    try {
        const res = await fetch(`${API}/favorites`, { headers: authHeaders() });

        if (!res.ok) throw new Error("Favorites load failed");

        const favorites = await res.json();
        container.innerHTML = "";

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <h3>No Favorites Yet</h3>
                    <p>Heart a place to save it here</p>
                </div>`;
            return;
        }

        // Fetch each place details for display
        const placePromises = favorites.map(f =>
            fetch(`${API}/places/${f.placeId}`).then(r => r.ok ? r.json() : null)
        );

        const places = await Promise.all(placePromises);

        places.forEach((place, i) => {
            if (!place) return;
            const div = document.createElement("div");
            div.className = "favorite-card";
            div.innerHTML = `
                ${place.image ? `<img src="${place.image}" alt="${escapeHtml(place.name)}" loading="lazy">` : ''}
                <div class="favorite-info">
                    <h3>${escapeHtml(place.name)}</h3>
                    <p>📍 ${escapeHtml(place.location || 'Unknown')}</p>
                    <span class="badge">${escapeHtml(place.category || '')}</span>
                </div>
                <div class="favorite-actions">
                    <button onclick="window.location.href='place.html?id=${place.id}'" class="btn-view">View</button>
                    <button onclick="removeFavorite(${favorites[i].id}, this)" class="btn-remove">Remove</button>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error("Favorites error:", err);
        const container = document.getElementById("favoritesContainer");
        container.innerHTML = `<div class="empty-state"><p>Could not load favorites</p></div>`;
    }
}

async function removeFavorite(favoriteId, btn) {
    if (!confirm("Remove from favorites?")) return;

    try {
        await fetch(`${API}/favorites/${favoriteId}`, {
            method: "DELETE",
            headers: authHeaders()
        });
        showToast("Removed from favorites", "success");
        await loadFavorites();
        await loadProfile();
    } catch (err) {
        showToast("Failed to remove", "error");
    }
}

/* ================= LOAD PHOTOS ================= */
async function loadPhotos() {
    const container = document.getElementById("photosContainer");
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-images"></i>
            <h3>No Photos Yet</h3>
            <p>Photos you upload will appear here</p>
        </div>`;
}

/* ================= EDIT PROFILE MODAL ================= */
function openEditModal() {
    if (userData) {
        document.getElementById("editName").value = userData.name || "";
        document.getElementById("editUsername").value = userData.username || "";
        document.getElementById("editBio").value = userData.bio || "";
        document.getElementById("editLocation").value = userData.location || "";
        document.getElementById("bioCount").textContent = (userData.bio || "").length;
    }
    document.getElementById("editModal").classList.add("active");
    document.getElementById("dropdownMenu")?.classList.remove("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

async function updateProfile() {
    const data = {
        name:     document.getElementById("editName").value.trim(),
        username: document.getElementById("editUsername").value.trim(),
        bio:      document.getElementById("editBio").value.trim(),
        location: document.getElementById("editLocation").value.trim()
    };

    if (!data.name) { showToast("Name is required", "error"); return; }

    showLoading();
    try {
        const res = await fetch(`${API}/users/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        showToast("Profile updated successfully", "success");
        closeEditModal();
        await loadProfile();

    } catch (error) {
        console.error("Profile update failed:", error);
        showToast("Failed to update profile", "error");
    } finally {
        hideLoading();
    }
}

/* ================= CHANGE PASSWORD ================= */
function openPasswordModal() {
    document.getElementById("passwordModal").classList.add("active");
    document.getElementById("dropdownMenu")?.classList.remove("active");
}

function closePasswordModal() {
    document.getElementById("passwordModal").classList.remove("active");
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("passwordStrength").innerHTML = "";
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = document.getElementById('passwordStrength');

    if (!password) { strengthBar.innerHTML = ''; return; }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#10b981'];

    strengthBar.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill" style="width: ${strength * 25}%; background: ${colors[strength - 1] || colors[0]}"></div>
        </div>
        <span style="color: ${colors[strength - 1] || colors[0]}; font-size: 12px; margin-top: 4px; display: block;">
            ${labels[strength - 1] || labels[0]} password
        </span>
    `;
}

async function changePassword() {
    const currentPassword  = document.getElementById("currentPassword").value;
    const newPassword      = document.getElementById("newPassword").value;
    const confirmPassword  = document.getElementById("confirmPassword").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast("Please fill in all fields", "error"); return;
    }

    if (newPassword !== confirmPassword) {
        showToast("New passwords do not match", "error"); return;
    }

    if (newPassword.length < 8) {
        showToast("Password must be at least 8 characters", "error"); return;
    }

    showLoading();
    try {
        const res = await fetch(`${API}/users/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        showToast("Password updated successfully", "success");
        closePasswordModal();

    } catch (error) {
        console.error("Password change failed:", error);
        showToast(error.message || "Failed to change password", "error");
    } finally {
        hideLoading();
    }
}

/* ================= SETTINGS ================= */
function openSettingsModal() {
    document.getElementById("settingsModal").classList.add("active");
    document.getElementById("dropdownMenu")?.classList.remove("active");
}

function closeSettingsModal() {
    document.getElementById("settingsModal").classList.remove("active");
}

async function saveSettings() {
    const settings = {
        profilePublic:      document.getElementById("profilePublic").checked,
        showEmail:          document.getElementById("showEmail").checked,
        emailNotifications: document.getElementById("emailNotifications").checked,
        reviewNotifications: document.getElementById("reviewNotifications").checked
    };

    showLoading();
    try {
        const res = await fetch(`${API}/users/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(settings)
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        showToast("Settings saved successfully", "success");
        closeSettingsModal();

    } catch (error) {
        console.error("Settings save failed:", error);
        showToast("Failed to save settings", "error");
    } finally {
        hideLoading();
    }
}

/* ================= EXPORT DATA ================= */
async function exportData() {
    showLoading();
    try {
        const res = await fetch(`${API}/users/export`, { headers: authHeaders() });

        if (!res.ok) throw new Error("Export failed");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `abandoned-world-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast("Data exported successfully", "success");

    } catch (error) {
        console.error("Export failed:", error);
        showToast("Failed to export data", "error");
    } finally {
        hideLoading();
    }
}

/* ================= DELETE ACCOUNT ================= */
async function deleteAccount() {
    const confirmed = confirm(
        "⚠️ WARNING: This will permanently delete your account and all data.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?"
    );
    if (!confirmed) return;

    const verification = prompt('Type "DELETE MY ACCOUNT" to confirm:');
    if (verification !== "DELETE MY ACCOUNT") {
        showToast("Account deletion cancelled", "info"); return;
    }

    showLoading();
    try {
        const res = await fetch(`${API}/users/delete`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error(await readResponseMessage(res));

        showToast("Account deleted successfully", "success");

        setTimeout(() => {
            localStorage.removeItem("jwtToken");
            window.location.href = LOGIN_PAGE;
        }, 2000);

    } catch (error) {
        console.error("Delete account failed:", error);
        showToast("Failed to delete account", "error");
    } finally {
        hideLoading();
    }
}

/* ================= LOGOUT ================= */
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("jwtToken");
        showToast("Logged out successfully", "success");
        setTimeout(() => { window.location.href = LOGIN_PAGE; }, 1000);
    }
}
