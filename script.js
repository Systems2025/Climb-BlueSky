document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const routeListBody = document.getElementById('route-list-body');
    const noRoutesMessage = document.getElementById('no-routes-message');
    const routeTable = document.getElementById('route-table');
    const routeTypeFilter = document.getElementById('route-type');
    const gradeRangeFilter = document.getElementById('grade-range');
    const wallSectionFilter = document.getElementById('wall-section');
    const holdColorFilter = document.getElementById('hold-color');
    const resetFiltersButton = document.getElementById('reset-filters');
    const weeklyRouteChallengeList = document.getElementById('weekly-route-challenge-list');
    const gradeValueInput = document.getElementById('grade-value-input');
    const fromScaleSelect = document.getElementById('from-scale-select');
    const translateGradeButton = document.getElementById('translate-grade-button');
    const resultVScale = document.getElementById('result-vscale');
    const resultFont = document.getElementById('result-font');
    const resultYDS = document.getElementById('result-yds');
    const feedbackModal = document.getElementById('feedback-modal');
    const closeModalButton = feedbackModal.querySelector('.close-button');
    const feedbackForm = document.getElementById('feedback-form');
    const modalRouteName = document.getElementById('modal-route-name');
    const modalRouteIdInput = document.getElementById('modal-route-id');
    const starRatingContainer = feedbackModal.querySelector('.star-rating');
    const feedbackRatingValueInput = document.getElementById('feedback-rating-value');
    let currentRating = 0;
    const generateRandomNameButton = document.getElementById('generate-random-name-button');
    const randomRouteNameOutput = document.getElementById('random-route-name-output');

    // --- Route List & Filter Logic ---
    function populateFilterOptions() {
        if (typeof allRoutes === 'undefined' || allRoutes.length === 0 || !wallSectionFilter || !holdColorFilter) {
            return;
        }
        const walls = [...new Set(allRoutes.map(route => route.wall).filter(Boolean))].sort();
        const colors = [...new Set(allRoutes.map(route => route.color).filter(Boolean))].sort();
        wallSectionFilter.innerHTML = '<option value="all">All Walls/Areas</option>';
        walls.forEach(wall => { const option = document.createElement('option'); option.value = wall; option.textContent = wall; wallSectionFilter.appendChild(option); });
        holdColorFilter.innerHTML = '<option value="all">All Colors</option>';
        colors.forEach(color => { const option = document.createElement('option'); option.value = color; option.textContent = color; holdColorFilter.appendChild(option); });
    }

    function displayRoutes(routesToDisplay) {
        if (!routeListBody) return;
        routeListBody.innerHTML = '';
        if (routesToDisplay.length === 0) {
            if(noRoutesMessage) noRoutesMessage.style.display = 'block';
            if (routeTable) routeTable.style.display = 'none';
            return;
        }
        if(noRoutesMessage) noRoutesMessage.style.display = 'none';
        if (routeTable) routeTable.style.display = 'table';
        routesToDisplay.sort((a, b) => new Date(b.setDate) - new Date(a.setDate));
        routesToDisplay.forEach(route => {
            const tr = document.createElement('tr');
            const setDate = new Date(route.setDate); const today = new Date();
            const setDateDay = new Date(setDate.getFullYear(), setDate.getMonth(), setDate.getDate());
            const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const diffTime = Math.abs(todayDay - setDateDay);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isNew = diffDays <= (typeof NEW_ROUTE_THRESHOLD_DAYS !== 'undefined' ? NEW_ROUTE_THRESHOLD_DAYS : 14);
            const formattedSetDate = setDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            let gradeDisplay = route.grade || 'N/A';
            if (route.type === 'boulder' && gradeDisplay !== 'N/A' && !String(gradeDisplay).toUpperCase().startsWith('V')) { gradeDisplay = `V${gradeDisplay}`; }
            const routeNameForModal = `${route.wall || 'Area'} ${gradeDisplay} (${route.color || 'N/A'})`;
            tr.innerHTML = `
                <td>${route.wall || 'N/A'}</td> <td>${gradeDisplay}</td>
                <td><span class="hold-color-swatch-table" style="background-color:${route.colorHex || '#ccc'};"></span> ${route.color || 'N/A'}</td>
                <td>${route.type ? route.type.charAt(0).toUpperCase() + route.type.slice(1) : 'N/A'}</td>
                <td>${formattedSetDate}</td> <td class="status-cell">${isNew ? '<span class="new-badge">NEW!</span>' : ''}</td>
                <td><button class="feedback-button" data-route-id="${route.id}" data-route-name="${routeNameForModal}">Feedback</button></td>
            `;
            routeListBody.appendChild(tr);
        });
        routeListBody.querySelectorAll('.feedback-button').forEach(button => button.addEventListener('click', handleOpenFeedbackModal));
    }

    function checkGrade(routeGradeInput, selectedRange) {
        if (selectedRange === "all") return true;
        if (!routeGradeInput) return false;

        const routeGrade = String(routeGradeInput).toUpperCase().trim();
        
        if (routeGrade.startsWith('V')) { // Boulder grades
            if (!selectedRange.startsWith('v')) return false;
            const gradeNumMatch = routeGrade.match(/V(\d+)/);
            if (!gradeNumMatch) return false;
            const gradeNum = parseInt(gradeNumMatch[1]);
            const rangeParts = selectedRange.split('-'); // e.g. "v0-v2"
            if (rangeParts.length === 1 && rangeParts[0].endsWith('+')) { // e.g. v9+
                 const lowerBound = parseInt(rangeParts[0].substring(1, rangeParts[0].length -1));
                 return gradeNum >= lowerBound;
            } else if (rangeParts.length === 2) { // e.g. v0-v2
                const lowerBound = parseInt(rangeParts[0].substring(1));
                const upperBound = parseInt(rangeParts[1].startsWith('V') ? rangeParts[1].substring(1) : rangeParts[1]);
                if (isNaN(lowerBound) || isNaN(upperBound)) return false;
                return gradeNum >= lowerBound && gradeNum <= upperBound;
            }
        } else if (routeGrade.startsWith('5.')) { // Rope grades (YDS)
            if (!selectedRange.startsWith('5.')) return false;
             // Extract the numeric part of YDS, e.g., 5.10a -> 10, 5.9 -> 9
            const routeGradeBaseMatch = routeGrade.match(/5\.(\d+)/);
            if (!routeGradeBaseMatch) return false;
            const routeGradeBase = parseInt(routeGradeBaseMatch[1]);

            const rangeParts = selectedRange.split('-'); // e.g. "5.10-5.11"
            if (rangeParts.length === 1 && rangeParts[0].endsWith('+')) { // e.g. 5.12+
                const lowerBoundBaseMatch = rangeParts[0].match(/5\.(\d+)\+/);
                if (!lowerBoundBaseMatch) return false;
                const lowerBoundBase = parseInt(lowerBoundBaseMatch[1]);
                return routeGradeBase >= lowerBoundBase;
            } else if (rangeParts.length === 2) { // e.g. 5.10-5.11
                const lowerBoundBaseMatch = rangeParts[0].match(/5\.(\d+)/);
                const upperBoundBaseMatch = rangeParts[1].match(/5\.(\d+)/);
                if (!lowerBoundBaseMatch || !upperBoundBaseMatch) return false;
                const lowerBoundBase = parseInt(lowerBoundBaseMatch[1]);
                const upperBoundBase = parseInt(upperBoundBaseMatch[1]);
                return routeGradeBase >= lowerBoundBase && routeGradeBase <= upperBoundBase;
            }
        }
        return false;
    }

    function filterRoutes() {
        if (typeof allRoutes === 'undefined' || !routeTypeFilter || !gradeRangeFilter || !wallSectionFilter || !holdColorFilter) return;
        const type = routeTypeFilter.value; const grade = gradeRangeFilter.value;
        const wall = wallSectionFilter.value; const color = holdColorFilter.value;
        const filteredRoutes = allRoutes.filter(route => {
            const typeMatch = (type === 'all' || route.type === type);
            const gradeMatch = checkGrade(route.grade, grade);
            const wallMatch = (wall === 'all' || route.wall === wall);
            const colorMatch = (color === 'all' || route.color === color);
            return typeMatch && gradeMatch && wallMatch && colorMatch;
        });
        displayRoutes(filteredRoutes);
    }
    if (routeTypeFilter) routeTypeFilter.addEventListener('change', filterRoutes);
    if (gradeRangeFilter) gradeRangeFilter.addEventListener('change', filterRoutes);
    if (wallSectionFilter) wallSectionFilter.addEventListener('change', filterRoutes);
    if (holdColorFilter) holdColorFilter.addEventListener('change', filterRoutes);
    if (resetFiltersButton) resetFiltersButton.addEventListener('click', () => {
        if(routeTypeFilter) routeTypeFilter.value = 'all'; if(gradeRangeFilter) gradeRangeFilter.value = 'all';
        if(wallSectionFilter) wallSectionFilter.value = 'all'; if(holdColorFilter) holdColorFilter.value = 'all';
        filterRoutes();
    });

    // --- Challenge List Population ---
    function populateChallengeRoutes() {
        if (typeof allRoutes === 'undefined' || !weeklyRouteChallengeList) {
            if (weeklyRouteChallengeList) weeklyRouteChallengeList.innerHTML = '<li class="no-challenge-routes">Could not load challenge routes.</li>';
            return;
        }
        const challengeRoutes = allRoutes.filter(route => route.isChallenge);
        weeklyRouteChallengeList.innerHTML = ''; 
        if (challengeRoutes.length === 0) {
            const li = document.createElement('li'); li.classList.add('no-challenge-routes');
            li.textContent = 'No specific route challenges this week. Check back soon!';
            weeklyRouteChallengeList.appendChild(li);
        } else {
            challengeRoutes.forEach(route => {
                const li = document.createElement('li'); li.classList.add('challenge-route-item');
                let gradeDisplay = route.grade || '';
                if (route.type === 'boulder' && gradeDisplay && !String(gradeDisplay).toUpperCase().startsWith('V')) { gradeDisplay = `V${gradeDisplay}`; }
                li.innerHTML = `<span class="challenge-icon">⭐</span> <strong>${route.wall || 'Area'} ${gradeDisplay}</strong> (${route.color || 'N/A'}) <br><span style="font-size:0.8em; margin-left: 23px;">Set: ${new Date(route.setDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>`;
                weeklyRouteChallengeList.appendChild(li);
            });
        }
    }

    // --- Grade Translator Logic ---
    const gradeChart = [ /* ... same chart data ... */ ]; const ydsChart = [ /* ... same chart data ... */ ];
    function normalizeGradeInput(grade, scale) { /* ... same logic ... */ }
    function translateGrade() { /* ... same logic ... */ }
    if (translateGradeButton) translateGradeButton.addEventListener('click', translateGrade);
    if (gradeValueInput) gradeValueInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); translateGrade(); }});

    // --- Feedback Modal Logic ---
    function handleOpenFeedbackModal(event) {
        const routeId = event.target.dataset.routeId; const routeName = event.target.dataset.routeName;
        if(modalRouteName) modalRouteName.textContent = routeName; if(modalRouteIdInput) modalRouteIdInput.value = routeId;
        if(feedbackForm) feedbackForm.reset(); currentRating = 0; updateStarDisplay(0);
        if(feedbackModal) feedbackModal.style.display = 'flex';
    }
    function closeFeedbackModal() { if(feedbackModal) feedbackModal.style.display = 'none'; }
    function handleStarClick(event) {
        if (event.target.classList.contains('star')) {
            currentRating = parseInt(event.target.dataset.value);
            if(feedbackRatingValueInput) feedbackRatingValueInput.value = currentRating;
            updateStarDisplay(currentRating);
        }
    }
    function updateStarDisplay(rating) {
        if(!starRatingContainer) return;
        const stars = starRatingContainer.querySelectorAll('.star');
        stars.forEach(star => { star.classList.toggle('selected', parseInt(star.dataset.value) <= rating); });
    }
    function handleFeedbackSubmit(event) {
        event.preventDefault(); const formData = new FormData(feedbackForm);
        const feedbackData = { routeId: formData.get('routeId'), rating: formData.get('rating'), comments: formData.get('comments'), name: formData.get('name') || "Anonymous" };
        console.log("Feedback Submitted:", feedbackData); // Replace with actual submission
        alert(`Thank you for your feedback on ${modalRouteName.textContent}!`); closeFeedbackModal();
    }
    if (closeModalButton) closeModalButton.addEventListener('click', closeFeedbackModal);
    if (starRatingContainer) starRatingContainer.addEventListener('click', handleStarClick);
    if (feedbackForm) feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    window.addEventListener('click', (event) => { if (event.target === feedbackModal) closeFeedbackModal(); });

    // --- Random Route Name Generator Logic ---
    const routeNameParts = {
        adjectives: ["Slippery", "Crimpy", "Juggy", "Slopey", "Dynamic", "Static", "Pump", "Endurance", "Power", "Techy", "Awkward", "Flowy", "Vertical", "Overhanging", "Hidden", "Whispering", "Cosmic", "Rusty", "Velvet", "Silent", "Gritty", "Atomic", "BlueSky", "Azure", "Steep", "Skyward", "Cloud", "Celestial"],
        nouns: ["Panic", "Crimpzilla", "Haul", "Fiesta", "Master", "Problem", "Quest", "Journey", "Nightmare", "Dream", "Crux", "Dyno", "Slab", "Arete", "Dihedral", "Pocket", "Edge", "Unicorn", "Gargoyle", "Whisper", "Echo", "Shadow", "Comet", "Ridge", "Peak", "Horizon", "Ascent", "Summit", "Pinnacle"],
        verbs: ["Crusher", "Sender", "Tickler", "Smasher", "Dangler", "Flyer", "Crawler", "Ninja", "Wizard", "Surfer", "Voyager", "Explorer", "Soarer", "Glider", "Dancer", "Leaper"],
        funNouns: ["Banana", "Pickle", "Wombat", "Yeti", "Gremlin", "Sasquatch", "Potato", "Cucumber", "Jellyfish", "Gecko", "Cloud", "Zephyr", "Quokka", "Alpaca"]
    };
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function generateRandomRouteName() {
        const adj = getRandomElement(routeNameParts.adjectives); const noun = getRandomElement(routeNameParts.nouns);
        let name = `${adj} ${noun}`;
        if (Math.random() < 0.3) { const thirdPartType = Math.random() < 0.5 ? routeNameParts.verbs : routeNameParts.funNouns; const thirdPart = getRandomElement(thirdPartType); name = `${adj} ${thirdPart} ${noun}`; }
        else if (Math.random() < 0.15) { name = `The ${adj} ${noun}`; }
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    if (generateRandomNameButton && randomRouteNameOutput) {
        generateRandomNameButton.addEventListener('click', () => { randomRouteNameOutput.textContent = generateRandomRouteName(); });
    }

    // --- Initial Page Load ---
    function initPage() {
        if (typeof allRoutes !== 'undefined' && allRoutes.length > 0) {
            if (typeof populateFilterOptions === 'function') populateFilterOptions();
            if (typeof displayRoutes === 'function') displayRoutes(allRoutes);
            if (typeof populateChallengeRoutes === 'function') populateChallengeRoutes();
        } else if (routeListBody) {
            if(noRoutesMessage) noRoutesMessage.style.display = 'block';
            if (routeTable) routeTable.style.display = 'none';
            if (typeof populateChallengeRoutes === 'function') populateChallengeRoutes();
        } else {
            if (typeof populateChallengeRoutes === 'function') populateChallengeRoutes();
        }
        if(randomRouteNameOutput) randomRouteNameOutput.textContent = "- Click the button -";
    }
    initPage();
});
