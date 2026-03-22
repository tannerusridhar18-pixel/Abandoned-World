// ================= API CONFIGURATION =================

const API_URL = "http://localhost:8081/api/places";

// ================= DOM ELEMENTS =================

document.addEventListener("DOMContentLoaded", function () {

    const grid = document.getElementById("exploreGrid");
    const searchInput = document.getElementById("exploreSearch");
    const categoryFilter = document.getElementById("exploreCategory");
    const sortBy = document.getElementById("sortBy");
    const emptyState = document.getElementById("emptyState");
    const pageLoader = document.getElementById("pageLoader");
    const clearFiltersBtn = document.getElementById("clearFilters");
    const resultsCount = document.getElementById("resultsCount");
    const filterInfo = document.getElementById("filterInfo");
    const scrollToTopBtn = document.getElementById("scrollToTop");
    const navbar = document.querySelector(".navbar");
    const viewBtns = document.querySelectorAll(".view-btn");
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    // ================= STATE =================

    let userFavorites = [];   // array of placeIds already favorited
    let allPlaces = [];
    let filteredData = [];
    let currentView = 'grid';
    let currentFilters = {
        search: '',
        category: 'all',
        sort: 'default'
    };

    // ================= INITIALIZATION =================

    async function init() {
        setupEventListeners();
        await loadFavorites();           // load favorites BEFORE rendering cards
        await loadPlacesFromBackend();

        setTimeout(() => {
            if (pageLoader) pageLoader.classList.add('hidden');
        }, 300);
    }

    // ================= LOAD FAVORITES =================
    // Mirrors the same pattern used in home.js so heart icons are consistent

    async function loadFavorites() {
        try {
            const token = localStorage.getItem("jwtToken");
            if (!token) return;

            const res = await fetch("http://localhost:8081/api/favorites", {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) return;

            const data = await res.json();
            userFavorites = data.map(f => f.placeId);
        } catch (err) {
            console.log("Explore: favorite load error", err);
        }
    }

    // ================= LOAD PLACES FROM BACKEND =================

    async function loadPlacesFromBackend() {
        try {
            console.log('Fetching places from backend...');

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            allPlaces = await response.json();
            filteredData = [...allPlaces];

            console.log('Loaded places:', allPlaces.length);

            renderPlaces(allPlaces);
            updateResultsInfo();

        } catch (error) {
            console.error('Error loading places:', error);
            showError();
        }
    }

    // ================= EVENT LISTENERS =================

    function setupEventListeners() {
        if (searchInput)    searchInput.addEventListener("input", debounce(handleSearch, 300));
        if (categoryFilter) categoryFilter.addEventListener("change", handleCategoryChange);
        if (sortBy)         sortBy.addEventListener("change", handleSortChange);
        if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearAllFilters);

        if (viewBtns) {
            viewBtns.forEach(btn => btn.addEventListener("click", handleViewChange));
        }

        window.addEventListener('scroll', handleScroll);

        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }

    // ================= SEARCH HANDLER =================

    function handleSearch() {
        currentFilters.search = searchInput.value.toLowerCase().trim();
        applyFilters();
    }

    // ================= CATEGORY HANDLER =================

    function handleCategoryChange() {
        currentFilters.category = categoryFilter.value;
        applyFilters();
    }

    // ================= SORT HANDLER =================

    function handleSortChange() {
        currentFilters.sort = sortBy.value;
        applyFilters();
    }

    // ================= APPLY FILTERS =================

    function applyFilters() {
        let result = [...allPlaces];

        if (currentFilters.search) {
            result = result.filter(place =>
                place.name.toLowerCase().includes(currentFilters.search) ||
                (place.description && place.description.toLowerCase().includes(currentFilters.search)) ||
                (place.info && place.info.toLowerCase().includes(currentFilters.search)) ||
                (place.category && place.category.toLowerCase().includes(currentFilters.search))
            );
        }

        if (currentFilters.category !== "all") {
            result = result.filter(place => place.category === currentFilters.category);
        }

        result = sortPlaces(result, currentFilters.sort);
        filteredData = result;

        renderPlaces(result);
        updateFilterUI();
        updateResultsInfo();
    }

    // ================= SORT PLACES =================

    function sortPlaces(places, sortType) {
        const sorted = [...places];
        switch (sortType) {
            case 'name-asc':  return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:          return sorted;
        }
    }

    // ================= RENDER PLACES =================

    function renderPlaces(places) {
        if (!grid) return;

        grid.innerHTML = "";
        if (emptyState) emptyState.style.display = "none";

        if (places.length === 0) {
            if (emptyState) emptyState.style.display = "flex";
            return;
        }

        places.forEach((place, index) => {
            const card = createPlaceCard(place, index);
            grid.appendChild(card);
        });
    }

    // ================= CREATE PLACE CARD =================

    function createPlaceCard(place, index) {
        const card = document.createElement("div");
        card.className = "place-card";

        const description = place.description || place.info || 'Discover this mysterious abandoned place...';
        const isFav = userFavorites.includes(place.id);  // correct initial state

        card.innerHTML = `
${place.image ? `<img src="${place.image}" alt="${place.name}" class="place-card-image" loading="lazy">` : ''}

<div class="place-card-content">

<div class="place-title-row">
<h3>${place.name}</h3>
<span class="favorite-icon" title="Add to favorites">${isFav ? '❤️' : '♡'}</span>
</div>

<p>${description}</p>

<div class="place-card-footer">
<span class="place-card-location">📍 ${place.location || 'Unknown location'}</span>
<button class="place-card-action" onclick="openPlace(${place.id})">Explore</button>
</div>

</div>
`;

        // ── Favorite toggle (consistent with home.js) ──
        const heart = card.querySelector(".favorite-icon");

        heart.addEventListener("click", function (e) {
            e.stopPropagation();

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
                body: JSON.stringify({ placeId: place.id })
            })
            .then(res => res.text())
            .then(data => {
                if (data.includes("Added")) {
                    heart.textContent = "❤️";
                    userFavorites.push(place.id);
                } else {
                    heart.textContent = "♡";
                    userFavorites = userFavorites.filter(id => id !== place.id);
                }
            })
            .catch(err => console.error("Favorite error:", err));
        });

        return card;
    }

    // ================= CATEGORY EMOJI =================

    function getCategoryEmoji(category) {
        const emojiMap = {
            'Haunted Places': '👻',
            'Abandoned Places': '🏥',
            'Historical Sites': '🚇',
            'Lost cities': '⚔️',
            'Mysterious Places': '🏝️'
        };
        return emojiMap[category] || '📍';
    }

    // ================= VIEW CHANGE =================

    function handleViewChange(e) {
        const btn = e.currentTarget;
        const view = btn.dataset.view;

        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentView = view;

        if (view === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    }

    // ================= UPDATE FILTER UI =================

    function updateFilterUI() {
        const hasActiveFilters =
            currentFilters.search ||
            currentFilters.category !== 'all' ||
            currentFilters.sort !== 'default';

        if (clearFiltersBtn) {
            clearFiltersBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';
        }
    }

    // ================= CLEAR ALL FILTERS =================

    function clearAllFilters() {
        if (searchInput)    searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortBy)         sortBy.value = 'default';

        currentFilters = { search: '', category: 'all', sort: 'default' };
        applyFilters();
    }

    // ================= UPDATE RESULTS INFO =================

    function updateResultsInfo() {
        if (resultsCount) resultsCount.textContent = filteredData.length;

        if (filterInfo) {
            let info = '';
            if (currentFilters.category !== 'all') {
                info = ` in ${currentFilters.category}`;
            }
            if (currentFilters.search) {
                info += ` matching "${currentFilters.search}"`;
            }
            filterInfo.textContent = info;
        }
    }

    // ================= SCROLL HANDLING =================

    function handleScroll() {
        const scrollY = window.scrollY;

        if (navbar) {
            navbar.classList.toggle('scrolled', scrollY > 50);
        }

        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('visible', scrollY > 300);
        }
    }

    // ================= SHOW ERROR =================

    function showError() {
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #ff6b6b;">
                    <h3 style="font-size: 24px; margin-bottom: 10px;">Unable to Load Places</h3>
                    <p style="color: #aaa; margin-bottom: 20px;">Please check your backend connection</p>
                    <button onclick="location.reload()" style="padding: 12px 30px; background: #f5d742; color: black; border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // ================= DEBOUNCE =================

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ================= START APP =================

    init();

});

// ================= GLOBAL: navigate to place detail =================

function openPlace(id) {
    window.location.href = `place.html?id=${id}`;
}
