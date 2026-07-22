const newsContainer = document.getElementById('news-container');
const loadingIndicator = document.getElementById('loading');
const themeToggle = document.getElementById('theme-toggle');

let allArticles = [];
let articlesPerBatch = 10;
let currentIndex = 0;
let loading = false;

// === Tema Light/Dark ===
function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌞' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(newTheme);
});

applyTheme(localStorage.getItem('theme') || 'light');

// === Timp relativ (ex: acum 3 ore) ===
function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'acum câteva minute';
  return `acum ${diffHrs} ${diffHrs === 1 ? 'oră' : 'ore'}`;
}

// === Favicon Helper ===
function getFaviconUrl(source) {
  return `https://www.google.com/s2/favicons?sz=32&domain_url=${source}`;
}

// === Crează cardul unei știri ===
function createCard(article) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = article.link;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

// Verificăm extensia
const imageUrl = article.image || '';

// Dacă URL-ul este un proxy (ex: img.php?u=...)
let realImageUrl = imageUrl;
if (imageUrl.includes('img.php?u=')) {
  // Extragem URL-ul real al imaginii din parametru 'u'
  const urlParams = new URLSearchParams(new URL(imageUrl).search);
  realImageUrl = decodeURIComponent(urlParams.get('u')) || imageUrl;
}

// Verificăm extensia pe URL-ul real al imaginii
const isImage = ['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp'].some(ext => realImageUrl.toLowerCase().endsWith(ext));
const isVideo = ['.mp4', '.webm', '.ogg'].some(ext => imageUrl.toLowerCase().endsWith(ext));

let mediaElement = '';

if (isImage) {
  mediaElement = `<img src="${realImageUrl}" alt="${article.title}">`;
} else if (isVideo) {
  mediaElement = `
    <video autoplay muted loop playsinline>
      <source src="${imageUrl}" type="video/mp4">
      Browserul tău nu suportă redarea video.
    </video>
  `;
} else {
  mediaElement = ''; // dacă nu e nici imagine, nici video, nu punem nimic
}

  card.innerHTML = `
    ${mediaElement}
    <div class="card-content">
      <h2>${article.title}</h2>
      <div class="source">
        <img class="favicon" src="${getFaviconUrl(article.source)}" alt=""> ${article.source} • ${timeAgo(article.pubDate)}
      </div>
    </div>
  `;

  return card;
}


// === Încarcă un nou batch de știri ===
function loadArticles() {
  if (loading) return;
  loading = true;
  loadingIndicator.style.display = 'block';

  const nextBatch = allArticles.slice(currentIndex, currentIndex + articlesPerBatch);
  nextBatch.forEach(article => {
    const card = createCard(article);
    newsContainer.appendChild(card);
  });

  currentIndex += articlesPerBatch;
  loading = false;
  if (currentIndex >= allArticles.length) {
    loadingIndicator.textContent = 'Toate știrile au fost încărcate.';
  } else {
    loadingIndicator.style.display = 'none';
  }
}

// === Scroll infinit ===
function handleScroll() {
  const scrollPos = window.scrollY + window.innerHeight;
  const triggerPos = document.body.offsetHeight * 0.7;
  if (scrollPos > triggerPos && !loading && currentIndex < allArticles.length) {
    loadArticles();
  }
}

window.addEventListener('scroll', handleScroll);

// === Fetch inițial ===
fetch('news.json')
  .then(response => response.json())
  .then(data => {
    allArticles = data;
    loadArticles();
  })
  .catch(error => {
    loadingIndicator.textContent = 'Eroare la încărcarea știrilor.';
    console.error(error);
  });
