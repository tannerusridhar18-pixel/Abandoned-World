/* ─── API & Routing ──────────────────────────────── */
const API = "http://localhost:8081/api/places";

const favoriteIcon = document.getElementById("favoriteIcon");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    showError("No place ID specified.");
}

/* ─── Fetch place data ──────────────────────────── */
fetch(`${API}/${id}`)
    .then(res => res.json())
    .then(place => {

        document.getElementById("loading").style.display = "none";
        document.getElementById("content").style.display = "block";

        document.getElementById("placeName").innerText        = place.name;
        document.getElementById("placeCategory").innerText    = place.category;
        document.getElementById("placeLocation").innerText    = place.location;
        document.getElementById("placeDescription").innerText = place.description;

        document.getElementById("placeImage").src = place.image || "";
        document.getElementById("placeImage").alt = place.name;

        document.getElementById("placeLat").innerText = place.latitude;
        document.getElementById("placeLng").innerText = place.longitude;

        document.getElementById("heroCoords").innerText =
            `${Number(place.latitude).toFixed(5)}°N  ${Number(place.longitude).toFixed(5)}°E`;

        animateIn();
        initMap(place.latitude, place.longitude, place.name);

        /* ─── Navigation Button ───────────────────── */
        const navBtn = document.getElementById("navigateBtn");

        if(navBtn){
            navBtn.addEventListener("click", () => {

                const lat = place.latitude;
                const lng = place.longitude;

                window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                    "_blank"
                );

            });
        }

        loadFavoriteStatus();
        loadReviews();
    })
    .catch(() => showError("Failed to load place."));


/* ─── Map init ─────────────────────────────────── */
function initMap(lat, lng, name) {
    const map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    const icon = L.divIcon({
        className: '',
        html: `
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z"
              fill="#c0392b" fill-opacity="0.9"/>
        <circle cx="14" cy="14" r="5" fill="#0a0a0c"/>
        <circle cx="14" cy="14" r="2" fill="#c0392b"/>
      </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36]
    });

    L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>`)
        .openPopup();
}


/* ─── UI helpers ───────────────────────────────── */
function showError(msg) {
    const loading = document.getElementById("loading");
    loading.innerHTML = `
    <div class="error-state">
      <div class="error-code">404</div>
      <div class="error-msg">${msg}</div>
      <a href="javascript:history.back()" style="color:#f5d742; margin-top:16px; display:inline-block;">← Go Back</a>
    </div>`;
}

function animateIn() {
    const els = document.querySelectorAll(
        '.hero-frame, .place-header, .info-grid, .description-section, .map-section'
    );
    els.forEach((el, i) => {
        el.style.animationDelay = `${0.1 + i * 0.09}s`;
    });
}


/* ─── Extra gallery images ─────────────────────── */
fetch(`http://localhost:8081/api/place-images/${id}`)
    .then(res => res.json())
    .then(images => {
        const gallery = document.getElementById("place-gallery");
        if (!gallery) return;

        images.forEach(img => {
            const image = document.createElement("img");
            image.src = img.imageUrl;
            image.style.cssText = "width:220px; border-radius:8px; object-fit:cover; margin:4px;";
            image.loading = "lazy";
            gallery.appendChild(image);
        });
    })
    .catch(err => console.log("Image load error:", err));


/* ─── Favorite status ──────────────────────────── */
async function loadFavoriteStatus() {
    const token = localStorage.getItem("jwtToken");
    if (!token || !favoriteIcon) return;

    try {
        const res = await fetch("http://localhost:8081/api/favorites", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) return;

        const data = await res.json();
        const ids = data.map(f => f.placeId);

        if (ids.includes(Number(id))) {
            favoriteIcon.textContent = "❤️";
        }
    } catch (err) {
        console.log("Favorite load error:", err);
    }
}

if (favoriteIcon) {
    favoriteIcon.addEventListener("click", function () {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            alert("Please log in to save favorites.");
            return;
        }

        fetch("http://localhost:8081/api/favorites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ placeId: Number(id) })
        })
        .then(res => res.text())
        .then(data => {
            if (data.includes("Added")) {
                favoriteIcon.textContent = "❤️";
            } else {
                favoriteIcon.textContent = "♡";
            }
        })
        .catch(err => console.log(err));
    });
}


/* ─── Reviews ──────────────────────────────────── */
function submitReview() {
    const text   = document.getElementById("reviewText").value.trim();
    const rating = parseInt(document.getElementById("reviewRating")?.value || "0");

    const token = localStorage.getItem("jwtToken");

    if (!text) {
        alert("Write something first");
        return;
    }

    if (!token) {
        alert("Please log in to submit a review.");
        return;
    }

    fetch("http://localhost:8081/api/reviews", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            placeId: Number(id),
            comment: text,
            rating: rating
        })
    })
    .then(res => res.json())
    .then(() => {
        document.getElementById("reviewText").value = "";
        if (document.getElementById("reviewRating")) {
            document.getElementById("reviewRating").value = "0";
        }
        loadReviews();
    })
    .catch(err => console.log(err));
}

async function loadReviews() {
    const res = await fetch(`http://localhost:8081/api/reviews/place/${id}`);
    const reviews = await res.json();

    const container = document.getElementById("reviewsList");
    container.innerHTML = "";

    if (reviews.length === 0) {
        container.innerHTML = `<p style="color:#aaa; font-style:italic;">No reviews yet. Be the first!</p>`;
        return;
    }

    reviews.forEach(r => {
        const div = document.createElement("div");
        div.className = "review-item";

        const rating = Number(r.rating) || 0;
        const stars  = "★".repeat(rating) + "☆".repeat(5 - rating);

        div.innerHTML = `
            <div class="review-header-row">
                <b>${r.userEmail || "Explorer"}</b>
                <span class="review-stars" title="${rating}/5 stars">${stars}</span>
            </div>
            <p>${r.comment}</p>
        `;

        container.appendChild(div);
    });
}