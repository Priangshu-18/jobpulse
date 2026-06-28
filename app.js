/* ============================================================
   JobPulse — Core Application Logic
   Smart job aggregation with scoring, search & filters
   ============================================================ */

// ==================== CONFIGURATION ====================
const CONFIG = {
  JOBS_PER_PAGE: 12,
  API_ENDPOINT: '/api/jobs',
  LOCAL_DB: 'jobs-database.json',

  // Skills from resume
  SKILLS: {
    primary: ['javascript', 'typescript', 'python', 'react', 'react.js', 'reactjs', 'node', 'node.js', 'nodejs', 'sql'],
    secondary: ['fastapi', 'fast api', 'django', 'mongodb', 'mongo', 'mysql', 'php', 'rest api', 'rest apis', 'restful', 'express', 'express.js'],
    aiml: ['tensorflow', 'langchain', 'langgraph', 'scikit-learn', 'sklearn', 'gemini', 'ai', 'machine learning', 'artificial intelligence', 'deep learning', 'nlp', 'natural language', 'computer vision', 'opencv', 'pandas', 'numpy', 'streamlit'],
    frontend: ['html', 'html5', 'css', 'css3', 'tailwind', 'tailwindcss', 'sass', 'scss'],
    tools: ['git', 'github', 'firebase', 'appwrite', 'postman', 'docker', 'vercel', 'netlify', 'aws', 'jwt', 'jwt auth'],
    computer_office: ['excel', 'word', 'powerpoint', 'ms office', 'data entry', 'typing', 'clerk', 'back office', 'tally', 'billing', 'computer operator', 'administration', 'documentation']
  },

  // Location priority mapping
  LOCATIONS: {
    high: ['gujarat', 'surat', 'ahmedabad', 'vadodara', 'rajkot', 'gandhinagar', 'mumbai', 'navi mumbai', 'thane', 'kolkata', 'calcutta', 'howrah'],
    medium: ['delhi', 'new delhi', 'ncr', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'jaipur', 'lucknow', 'indore', 'chandigarh', 'kochi', 'coimbatore', 'bhopal', 'thiruvananthapuram', 'visakhapatnam'],
    remote_india: ['remote', 'work from home', 'wfh', 'anywhere in india', 'pan india', 'india remote'],
    international: ['worldwide', 'global', 'anywhere', 'us', 'usa', 'uk', 'europe', 'canada', 'singapore', 'australia', 'germany', 'netherlands', 'international']
  },

  // Exclude jobs requiring these
  EXCLUDE_TITLE: ['senior', 'sr.', 'sr ', 'lead', 'principal', 'staff', 'distinguished', 'director', 'vp', 'vice president', 'head of', 'chief', 'cto', 'cio', 'architect', 'manager'],
  EXCLUDE_EDUCATION: ['masters required', 'phd required', 'doctorate', 'mtech required', 'm.tech required', 'post graduate required', 'pg required'],
  EXCLUDE_EXPERIENCE: ['8+ years', '10+ years', '7+ years', '6+ years', '5+ years', '9+ years', '12+ years', '15+ years']
};

// ==================== STATE ====================
let state = {
  allJobs: [],
  filteredJobs: [],
  displayedCount: 0,
  bookmarks: JSON.parse(localStorage.getItem('jobpulse-bookmarks') || '[]'),
  currentSection: 'jobs',
  searchQuery: '',
  filters: {
    location: '',
    type: '',
    category: '',
    role: ''
  },
  sortBy: 'priority',
  isLoading: true
};

// ==================== PLATFORMS DATA ====================
const PLATFORMS = {
  indian: [
    { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/search/?keywords=developer&location=India', icon: '💼', desc: 'Professional network' },
    { name: 'Naukri.com', url: 'https://www.naukri.com/developer-jobs', icon: '📋', desc: 'India\'s #1 job site' },
    { name: 'Indeed India', url: 'https://www.indeed.co.in/jobs?q=software+developer', icon: '🔍', desc: 'Global job search' },
    { name: 'Internshala', url: 'https://internshala.com/internships/computer-science-internship', icon: '🎓', desc: 'Internships & fresher jobs' },
    { name: 'Glassdoor', url: 'https://www.glassdoor.co.in/Job/india-developer-jobs-SRCH_IL.0,5_IN115_KO6,15.htm', icon: '🏢', desc: 'Reviews & salaries' },
    { name: 'Unstop', url: 'https://unstop.com/jobs', icon: '🏆', desc: 'Competitions & jobs' },
    { name: 'Freshersworld', url: 'https://www.freshersworld.com/jobs/category/it-software', icon: '🌱', desc: 'Fresher opportunities' },
    { name: 'Monster India', url: 'https://www.monsterindia.com/search/developer-jobs', icon: '👾', desc: 'Career site' },
    { name: 'Shine.com', url: 'https://www.shine.com/job-search/developer-jobs', icon: '✨', desc: 'Job portal' },
    { name: 'TimesJobs', url: 'https://www.timesjobs.com/candidate/job-search.html?searchType=personal498izedSearch&from=submit&txtKeywords=developer', icon: '📰', desc: 'Times group portal' },
    { name: 'Foundit', url: 'https://www.foundit.in/search/developer-jobs', icon: '🎯', desc: 'Formerly Monster' },
    { name: 'Apna', url: 'https://apna.co/', icon: '📱', desc: 'Professional networking' }
  ],
  remote: [
    { name: 'Remotive', url: 'https://remotive.com/remote-jobs/software-dev', icon: '🌍', desc: 'Remote tech jobs' },
    { name: 'We Work Remotely', url: 'https://weworkremotely.com/categories/remote-programming-jobs', icon: '💻', desc: 'Remote work board' },
    { name: 'Remote.co', url: 'https://remote.co/remote-jobs/developer/', icon: '🏠', desc: 'Remote job listings' },
    { name: 'AngelList / Wellfound', url: 'https://wellfound.com/jobs', icon: '😇', desc: 'Startup jobs' },
    { name: 'FlexJobs', url: 'https://www.flexjobs.com/remote-jobs/computer-it', icon: '🔄', desc: 'Flexible & remote' },
    { name: 'Toptal', url: 'https://www.toptal.com/', icon: '🏅', desc: 'Freelance network' },
    { name: 'Turing', url: 'https://www.turing.com/jobs', icon: '🤖', desc: 'Remote dev jobs' },
    { name: 'Arc.dev', url: 'https://arc.dev/remote-jobs', icon: '⚡', desc: 'Developer jobs' }
  ],
  govt: [
    { name: 'Sarkari Result', url: 'https://www.sarkariresult.com/', icon: '🏛️', desc: 'Govt job results' },
    { name: 'SSC', url: 'https://ssc.nic.in/', icon: '📝', desc: 'Staff Selection Commission' },
    { name: 'UPSC', url: 'https://www.upsc.gov.in/', icon: '🇮🇳', desc: 'Union Public Service' },
    { name: 'NCS Portal', url: 'https://www.ncs.gov.in/', icon: '🏢', desc: 'National Career Service' },
    { name: 'Railway Recruitment', url: 'https://www.rrbcdg.gov.in/', icon: '🚂', desc: 'Indian Railways' },
    { name: 'IBPS', url: 'https://www.ibps.in/', icon: '🏦', desc: 'Banking recruitment' },
    { name: 'FreeJobAlert', url: 'https://www.freejobalert.com/', icon: '🔔', desc: 'Govt job alerts' },
    { name: 'Sarkari Exam', url: 'https://www.sarkariexam.com/', icon: '📄', desc: 'Exam notifications' }
  ],
  social: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/feed/', icon: '🔗', desc: 'Professional posts' },
    { name: 'Twitter/X Jobs', url: 'https://twitter.com/search?q=%23hiring%20developer%20india&src=typed_query&f=live', icon: '🐦', desc: '#hiring tweets' },
    { name: 'Instagram Jobs', url: 'https://www.instagram.com/explore/tags/hiringdevelopers/', icon: '📸', desc: '#hiringdevelopers' },
    { name: 'Reddit Jobs', url: 'https://www.reddit.com/r/indianjobs/', icon: '🟠', desc: 'r/indianjobs' },
    { name: 'Facebook Jobs', url: 'https://www.facebook.com/jobs/', icon: '📘', desc: 'Job listings' },
    { name: 'Amazon Jobs', url: 'https://www.amazon.jobs/en/locations/india', icon: '📦', desc: 'Amazon India careers' },
    { name: 'Google Careers', url: 'https://careers.google.com/jobs/results/?location=India', icon: '🔍', desc: 'Google India jobs' },
    { name: 'Microsoft Careers', url: 'https://careers.microsoft.com/us/en/search-results?keywords=developer&country=India', icon: '🪟', desc: 'Microsoft India jobs' }
  ]
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  renderPlatforms();
  await loadJobs();
  updateLastUpdated();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Search
  document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Filters
  document.getElementById('filter-location').addEventListener('change', handleFilterChange);
  document.getElementById('filter-type').addEventListener('change', handleFilterChange);
  document.getElementById('filter-category').addEventListener('change', handleFilterChange);
  document.getElementById('filter-role').addEventListener('change', handleFilterChange);
  document.getElementById('sort-by').addEventListener('change', handleSortChange);
  document.getElementById('clear-filters').addEventListener('click', clearAllFilters);

  // Load More
  document.getElementById('load-more-btn').addEventListener('click', loadMoreJobs);

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Navigation
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');
    
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    backToTop.classList.toggle('visible', window.scrollY > 500);
  });

  // Back to top
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==================== DATA LOADING ====================
async function loadJobs() {
  state.isLoading = true;
  showLoading(true);

  try {
    const results = await Promise.allSettled([
      fetchLocalJobs(),
      fetchLiveJobs()
    ]);

    let jobs = [];

    // Merge results
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        jobs = jobs.concat(result.value);
      }
    });

    // Deduplicate by title + company
    const seen = new Set();
    jobs = jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter out jobs requiring senior/masters
    jobs = jobs.filter(job => !shouldExcludeJob(job));

    // Score and sort
    jobs = jobs.map(job => ({
      ...job,
      priorityScore: calculatePriorityScore(job),
      skillMatchCount: countSkillMatches(job)
    }));

    state.allJobs = jobs;
    applyFiltersAndSort();

  } catch (error) {
    console.error('Error loading jobs:', error);
    showToast('⚠️ Some job sources may be unavailable', 'warning');
  } finally {
    state.isLoading = false;
    showLoading(false);
  }
}

async function fetchLocalJobs() {
  try {
    const res = await fetch(CONFIG.LOCAL_DB);
    if (!res.ok) throw new Error('Local DB not found');
    const data = await res.json();
    return data.jobs || data;
  } catch (e) {
    console.warn('Local jobs database not available:', e.message);
    return [];
  }
}

async function fetchLiveJobs() {
  try {
    const res = await fetch(CONFIG.API_ENDPOINT);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.jobs || [];
  } catch (e) {
    console.warn('Backend API not available, falling back to direct Remotive fetch:', e.message);
    return fetchRemotiveJobs();
  }
}

async function fetchRemotiveJobs() {
  try {
    const categories = ['software-dev', 'data', 'devops'];
    const allJobs = [];

    for (const cat of categories) {
      try {
        const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=30`);
        if (!res.ok) continue;
        const data = await res.json();

        const jobs = (data.jobs || []).map(job => ({
          id: `remotive-${job.id}`,
          title: job.title || 'Untitled',
          company: job.company_name || 'Unknown',
          location: job.candidate_required_location || 'Remote — Worldwide',
          type: 'remote',
          category: 'private',
          salary: job.salary || 'Not disclosed',
          skills: job.tags || [],
          experience: 'Not specified',
          postedDate: job.publication_date || new Date().toISOString().split('T')[0],
          applyUrl: job.url || '#',
          source: 'Remotive',
          description: job.description || '',
          companyLogo: job.company_logo || ''
        }));

        allJobs.push(...jobs);
      } catch {
        continue;
      }
    }

    return allJobs;
  } catch (e) {
    console.warn('Remotive API unavailable:', e.message);
    return [];
  }
}

// ==================== SCORING ALGORITHM ====================
function calculatePriorityScore(job) {
  let score = 0;
  const location = (job.location || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();

  // Location score (0–100)
  if (CONFIG.LOCATIONS.high.some(l => location.includes(l))) {
    score += 100;
  } else if (CONFIG.LOCATIONS.remote_india.some(l => location.includes(l))) {
    score += 80;
  } else if (CONFIG.LOCATIONS.medium.some(l => location.includes(l))) {
    score += 70;
  } else if (location.includes('india')) {
    score += 50;
  } else if (CONFIG.LOCATIONS.international.some(l => location.includes(l))) {
    score += 40;
  } else {
    score += 30;
  }

  // Skill match score (0–100)
  score += countSkillMatches(job) * 8;

  // Recency score (0–100)
  const daysSincePosted = getDaysSince(job.postedDate);
  if (daysSincePosted <= 1) score += 100;
  else if (daysSincePosted <= 3) score += 90;
  else if (daysSincePosted <= 7) score += 80;
  else if (daysSincePosted <= 14) score += 60;
  else if (daysSincePosted <= 30) score += 40;
  else score += 20;

  // Government job bonus (people often search specifically)
  if (job.category === 'government') score += 15;

  // Entry-level / fresher bonus
  const exp = (job.experience || '').toLowerCase();
  if (exp.includes('fresher') || exp.includes('0') || exp.includes('entry') || exp.includes('graduate')) {
    score += 20;
  }

  return Math.min(score, 400);
}

function countSkillMatches(job) {
  const text = `${job.title} ${(job.skills || []).join(' ')} ${job.description || ''}`.toLowerCase();
  let matches = 0;

  Object.values(CONFIG.SKILLS).flat().forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      matches++;
    }
  });

  return matches;
}

function shouldExcludeJob(job) {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const exp = (job.experience || '').toLowerCase();

  // Exclude senior/lead/etc titles
  if (CONFIG.EXCLUDE_TITLE.some(term => title.includes(term))) return true;

  // Exclude education requirements
  if (CONFIG.EXCLUDE_EDUCATION.some(term => desc.includes(term))) return true;

  // Exclude high experience
  if (CONFIG.EXCLUDE_EXPERIENCE.some(term => {
    return exp.includes(term) || title.includes(term) || desc.includes(term);
  })) return true;

  return false;
}

// ==================== SEARCH & FILTER ====================
function handleSearch() {
  state.searchQuery = document.getElementById('search-input').value.trim();
  applyFiltersAndSort();
}

function handleFilterChange() {
  state.filters.location = document.getElementById('filter-location').value;
  state.filters.type = document.getElementById('filter-type').value;
  state.filters.category = document.getElementById('filter-category').value;
  state.filters.role = document.getElementById('filter-role').value;
  applyFiltersAndSort();
  renderActiveFilters();
}

function handleSortChange() {
  state.sortBy = document.getElementById('sort-by').value;
  applyFiltersAndSort();
}

function clearAllFilters() {
  state.searchQuery = '';
  state.filters = { location: '', type: '', category: '', role: '' };
  document.getElementById('search-input').value = '';
  document.getElementById('filter-location').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-role').value = '';
  applyFiltersAndSort();
  renderActiveFilters();
}

function applyFiltersAndSort() {
  let jobs = [...state.allJobs];

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    jobs = jobs.filter(job => {
      const searchText = `${job.title} ${job.company} ${job.location} ${(job.skills || []).join(' ')} ${job.description || ''}`.toLowerCase();
      return searchText.includes(q);
    });
  }

  // Location filter
  if (state.filters.location) {
    jobs = jobs.filter(job => matchesLocationFilter(job, state.filters.location));
  }

  // Type filter
  if (state.filters.type) {
    jobs = jobs.filter(job => {
      const t = (job.type || '').toLowerCase();
      if (state.filters.type === 'remote') return t === 'remote' || t === 'wfh' || t === 'work from home';
      if (state.filters.type === 'on-site') return t === 'on-site' || t === 'onsite' || t === 'office';
      if (state.filters.type === 'hybrid') return t === 'hybrid';
      return true;
    });
  }

  // Category filter
  if (state.filters.category) {
    jobs = jobs.filter(job => {
      const c = (job.category || '').toLowerCase();
      return c === state.filters.category;
    });
  }

  // Role filter
  if (state.filters.role) {
    jobs = jobs.filter(job => matchesRoleFilter(job, state.filters.role));
  }

  // Sort
  jobs.sort((a, b) => {
    switch (state.sortBy) {
      case 'priority':
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      case 'date':
        return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
      case 'company':
        return (a.company || '').localeCompare(b.company || '');
      default:
        return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
  });

  state.filteredJobs = jobs;
  state.displayedCount = 0;
  renderJobs(true);
  updateStats();
}

function matchesLocationFilter(job, filter) {
  const loc = (job.location || '').toLowerCase();
  switch (filter) {
    case 'gujarat': return CONFIG.LOCATIONS.high.slice(0, 6).some(l => loc.includes(l));
    case 'mumbai': return ['mumbai', 'navi mumbai', 'thane'].some(l => loc.includes(l));
    case 'kolkata': return ['kolkata', 'calcutta', 'howrah'].some(l => loc.includes(l));
    case 'delhi': return ['delhi', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'ncr', 'faridabad'].some(l => loc.includes(l));
    case 'bangalore': return ['bangalore', 'bengaluru'].some(l => loc.includes(l));
    case 'hyderabad': return loc.includes('hyderabad');
    case 'pune': return loc.includes('pune');
    case 'chennai': return loc.includes('chennai');
    case 'remote-india': return (loc.includes('remote') || loc.includes('wfh') || loc.includes('work from home')) && (loc.includes('india') || !CONFIG.LOCATIONS.international.some(l => loc.includes(l)));
    case 'remote-international': return (loc.includes('remote') || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere')) && !loc.includes('india');
    case 'other': return !CONFIG.LOCATIONS.high.concat(CONFIG.LOCATIONS.medium).some(l => loc.includes(l)) && !loc.includes('remote');
    default: return true;
  }
}

function matchesRoleFilter(job, filter) {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  switch (filter) {
    case 'fullstack': return title.includes('full stack') || title.includes('fullstack') || title.includes('full-stack') || desc.includes('full stack');
    case 'frontend': return title.includes('frontend') || title.includes('front-end') || title.includes('front end') || title.includes('react') || title.includes('ui developer');
    case 'backend': return title.includes('backend') || title.includes('back-end') || title.includes('back end') || title.includes('node.js') || title.includes('python developer');
    case 'aiml': return title.includes('ai') || title.includes('ml') || title.includes('machine learning') || title.includes('data scientist') || title.includes('deep learning');
    case 'python': return title.includes('python');
    case 'web': return title.includes('web developer') || title.includes('web engineer');
    case 'software': return title.includes('software engineer') || title.includes('software developer') || title.includes('sde');
    case 'data': return title.includes('data analyst') || title.includes('data engineer') || title.includes('data scientist');
    case 'devops': return title.includes('devops') || title.includes('sre') || title.includes('platform engineer') || title.includes('cloud');
    case 'dataentry': return title.includes('data entry') || title.includes('typing') || title.includes('billing') || title.includes('operator') || desc.includes('data entry');
    case 'clerk': return title.includes('clerk') || title.includes('assistant') || title.includes('executive') || title.includes('excel') || title.includes('back office') || title.includes('office');
    case 'other': return true;
    default: return true;
  }
}

// ==================== RENDERING ====================
function renderJobs(reset = false) {
  const grid = document.getElementById('jobs-grid');
  const emptyState = document.getElementById('empty-state');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  if (reset) {
    grid.innerHTML = '';
    state.displayedCount = 0;
  }

  const jobsToShow = state.filteredJobs.slice(state.displayedCount, state.displayedCount + CONFIG.JOBS_PER_PAGE);

  if (state.filteredJobs.length === 0) {
    emptyState.style.display = 'block';
    loadMoreWrap.style.display = 'none';
    document.getElementById('results-count').innerHTML = `<strong>0</strong> jobs found`;
    return;
  }

  emptyState.style.display = 'none';

  jobsToShow.forEach((job, index) => {
    const card = createJobCard(job, state.displayedCount + index);
    grid.appendChild(card);
  });

  state.displayedCount += jobsToShow.length;

  // Update results count
  document.getElementById('results-count').innerHTML = `Showing <strong>${state.displayedCount}</strong> of <strong>${state.filteredJobs.length}</strong> jobs`;

  // Show/hide load more
  loadMoreWrap.style.display = state.displayedCount < state.filteredJobs.length ? 'block' : 'none';
}

function createJobCard(job, index) {
  const card = document.createElement('div');
  const priorityClass = getPriorityClass(job);
  const isBookmarked = state.bookmarks.some(b => b.id === job.id);

  card.className = `job-card ${priorityClass}`;
  card.style.animationDelay = `${(index % CONFIG.JOBS_PER_PAGE) * 0.05}s`;

  const logoContent = job.companyLogo
    ? `<img src="${job.companyLogo}" alt="${job.company}" onerror="this.parentElement.textContent='${getCompanyInitial(job.company)}'">`
    : getCompanyInitial(job.company);

  const skillTags = (job.skills || []).slice(0, 5).map(skill => {
    const isMatched = isSkillMatched(skill);
    return `<span class="skill-tag ${isMatched ? 'matched' : ''}">${escapeHtml(skill)}</span>`;
  }).join('');

  const priorityBadge = getPriorityBadge(job);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-company-info">
        <div class="company-logo">${logoContent}</div>
        <div class="card-company-details">
          <div class="company-name">${escapeHtml(job.company)}</div>
          <div class="card-source">via ${escapeHtml(job.source || 'JobPulse')}</div>
        </div>
      </div>
      <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
              onclick="event.stopPropagation(); toggleBookmark('${job.id}')" 
              title="${isBookmarked ? 'Remove bookmark' : 'Save job'}">
        ${isBookmarked ? '📌' : '🔖'}
      </button>
    </div>
    <h3 class="card-title">${escapeHtml(job.title)}</h3>
    <div class="card-meta">
      <span class="meta-tag meta-location">📍 ${escapeHtml(truncate(job.location, 30))}</span>
      <span class="meta-tag meta-type">${getTypeIcon(job.type)} ${escapeHtml(capitalizeFirst(job.type || 'N/A'))}</span>
      ${job.experience && job.experience !== 'Not specified' ? `<span class="meta-tag meta-experience">📊 ${escapeHtml(job.experience)}</span>` : ''}
      ${job.salary && job.salary !== 'Not disclosed' ? `<span class="meta-tag meta-salary">💰 ${escapeHtml(truncate(job.salary, 20))}</span>` : ''}
      ${job.category === 'government' ? '<span class="meta-tag meta-govt">🏛️ Government</span>' : ''}
    </div>
    ${skillTags ? `<div class="card-skills">${skillTags}</div>` : ''}
    <div class="card-footer">
      <span class="card-date">📅 ${formatDate(job.postedDate)}</span>
      ${priorityBadge}
    </div>
  `;

  card.addEventListener('click', () => openJobModal(job));

  return card;
}

function getPriorityClass(job) {
  if (job.category === 'government') return 'priority-govt';
  const loc = (job.location || '').toLowerCase();
  if (CONFIG.LOCATIONS.high.some(l => loc.includes(l))) return 'priority-high';
  if (CONFIG.LOCATIONS.medium.some(l => loc.includes(l))) return 'priority-medium';
  if (CONFIG.LOCATIONS.remote_india.some(l => loc.includes(l))) return 'priority-remote';
  if (CONFIG.LOCATIONS.international.some(l => loc.includes(l))) return 'priority-intl';
  return 'priority-remote';
}

function getPriorityBadge(job) {
  const loc = (job.location || '').toLowerCase();
  if (job.category === 'government') return '<span class="card-priority priority-badge-high">🏛️ Govt</span>';
  if (CONFIG.LOCATIONS.high.some(l => loc.includes(l))) return '<span class="card-priority priority-badge-high">⭐ High Priority</span>';
  if (CONFIG.LOCATIONS.remote_india.some(l => loc.includes(l))) return '<span class="card-priority priority-badge-remote">🏠 Remote</span>';
  if (CONFIG.LOCATIONS.medium.some(l => loc.includes(l))) return '<span class="card-priority priority-badge-medium">📍 India</span>';
  if (CONFIG.LOCATIONS.international.some(l => loc.includes(l))) return '<span class="card-priority priority-badge-intl">🌍 International</span>';
  return '<span class="card-priority priority-badge-remote">💼 Available</span>';
}

function isSkillMatched(skill) {
  const s = skill.toLowerCase();
  return Object.values(CONFIG.SKILLS).flat().some(mySkill => 
    s.includes(mySkill) || mySkill.includes(s)
  );
}

// ==================== ACTIVE FILTERS ==================== 
function renderActiveFilters() {
  const container = document.getElementById('active-filters');
  container.innerHTML = '';

  const filterLabels = {
    location: document.getElementById('filter-location'),
    type: document.getElementById('filter-type'),
    category: document.getElementById('filter-category'),
    role: document.getElementById('filter-role')
  };

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value) {
      const select = filterLabels[key];
      const label = select.options[select.selectedIndex].text;
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.innerHTML = `${label} <span class="filter-chip-close" onclick="removeFilter('${key}')">✕</span>`;
      container.appendChild(chip);
    }
  });

  if (state.searchQuery) {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.innerHTML = `🔍 "${escapeHtml(state.searchQuery)}" <span class="filter-chip-close" onclick="clearSearch()">✕</span>`;
    container.appendChild(chip);
  }
}

function removeFilter(key) {
  state.filters[key] = '';
  document.getElementById(`filter-${key}`).value = '';
  applyFiltersAndSort();
  renderActiveFilters();
}

function clearSearch() {
  state.searchQuery = '';
  document.getElementById('search-input').value = '';
  applyFiltersAndSort();
  renderActiveFilters();
}

// ==================== BOOKMARKS ====================
function toggleBookmark(jobId) {
  const index = state.bookmarks.findIndex(b => b.id === jobId);
  
  if (index > -1) {
    state.bookmarks.splice(index, 1);
    showToast('📌 Job removed from bookmarks');
  } else {
    const job = state.allJobs.find(j => j.id === jobId);
    if (job) {
      state.bookmarks.push(job);
      showToast('✅ Job saved to bookmarks!', 'success');
    }
  }

  localStorage.setItem('jobpulse-bookmarks', JSON.stringify(state.bookmarks));
  updateBookmarkBadge();

  // Re-render if on bookmarks section
  if (state.currentSection === 'bookmarks') {
    renderBookmarks();
  }

  // Update card bookmark button
  applyFiltersAndSort();
}

function renderBookmarks() {
  const grid = document.getElementById('bookmarks-grid');
  const emptyState = document.getElementById('bookmarks-empty');
  grid.innerHTML = '';

  if (state.bookmarks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  state.bookmarks.forEach((job, index) => {
    grid.appendChild(createJobCard(job, index));
  });
}

function updateBookmarkBadge() {
  document.getElementById('bookmark-badge').textContent = state.bookmarks.length;
}

// ==================== MODAL ====================
function openJobModal(job) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const isBookmarked = state.bookmarks.some(b => b.id === job.id);

  // Clean description (strip HTML tags for safety but keep structure)
  let cleanDesc = (job.description || 'No description available.')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // If description is HTML, render it; otherwise treat as plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(cleanDesc);
  const descHtml = isHtml ? cleanDesc : `<p>${escapeHtml(cleanDesc)}</p>`;

  const skillTags = (job.skills || []).map(skill => {
    const isMatched = isSkillMatched(skill);
    return `<span class="skill-tag ${isMatched ? 'matched' : ''}">${escapeHtml(skill)}</span>`;
  }).join('');

  body.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-job-title">${escapeHtml(job.title)}</h2>
      <div class="modal-company">${escapeHtml(job.company)}</div>
      <div class="modal-meta">
        <span class="meta-tag meta-location">📍 ${escapeHtml(job.location)}</span>
        <span class="meta-tag meta-type">${getTypeIcon(job.type)} ${escapeHtml(capitalizeFirst(job.type || 'N/A'))}</span>
        ${job.experience && job.experience !== 'Not specified' ? `<span class="meta-tag meta-experience">📊 ${escapeHtml(job.experience)}</span>` : ''}
        ${job.salary && job.salary !== 'Not disclosed' ? `<span class="meta-tag meta-salary">💰 ${escapeHtml(job.salary)}</span>` : ''}
        ${job.category === 'government' ? '<span class="meta-tag meta-govt">🏛️ Government</span>' : ''}
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        📅 Posted: ${formatDate(job.postedDate)} &nbsp;|&nbsp; 🔗 Source: ${escapeHtml(job.source || 'JobPulse')}
      </div>
    </div>
    ${skillTags ? `
      <div class="modal-skills">
        <div class="modal-skills-title">Required Skills</div>
        <div class="card-skills">${skillTags}</div>
      </div>
    ` : ''}
    <div class="modal-description">${descHtml}</div>
    <div class="modal-actions">
      <a href="${escapeHtml(job.applyUrl)}" target="_blank" rel="noopener" class="modal-apply-btn">
        Apply Now →
      </a>
      <button class="modal-bookmark-btn" onclick="toggleBookmark('${job.id}'); closeModal();">
        ${isBookmarked ? '📌 Remove Bookmark' : '🔖 Save Job'}
      </button>
    </div>
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== SECTION SWITCHING ====================
function switchSection(section) {
  state.currentSection = section;

  // Update nav links
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  // Close mobile menu
  document.querySelector('.nav-links').classList.remove('open');

  // Toggle visibility
  const hero = document.querySelector('.hero');
  const searchSection = document.querySelector('.search-section');
  const jobsMain = document.querySelector('.jobs-main');
  const bookmarksSection = document.getElementById('bookmarks-section');
  const platformsSection = document.getElementById('platforms-section');

  hero.style.display = section === 'jobs' ? '' : 'none';
  searchSection.style.display = section === 'jobs' ? '' : 'none';
  jobsMain.style.display = section === 'jobs' ? '' : 'none';
  bookmarksSection.style.display = section === 'bookmarks' ? '' : 'none';
  platformsSection.style.display = section === 'platforms' ? '' : 'none';

  if (section === 'bookmarks') renderBookmarks();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== PLATFORMS RENDERING ====================
function renderPlatforms() {
  renderPlatformGrid('indian-platforms', PLATFORMS.indian);
  renderPlatformGrid('remote-platforms', PLATFORMS.remote);
  renderPlatformGrid('govt-platforms', PLATFORMS.govt);
  renderPlatformGrid('social-platforms', PLATFORMS.social);
}

function renderPlatformGrid(containerId, platforms) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = platforms.map(p => `
    <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="platform-card">
      <span class="platform-icon">${p.icon}</span>
      <div class="platform-info">
        <div class="platform-name">${escapeHtml(p.name)}</div>
        <div class="platform-desc">${escapeHtml(p.desc)}</div>
      </div>
    </a>
  `).join('');
}

// ==================== STATS ====================
function updateStats() {
  const jobs = state.allJobs;

  animateNumber('stat-total', jobs.length);
  animateNumber('stat-remote', jobs.filter(j => (j.type || '').toLowerCase() === 'remote').length);
  animateNumber('stat-onsite', jobs.filter(j => ['on-site', 'onsite', 'office'].includes((j.type || '').toLowerCase())).length);
  animateNumber('stat-govt', jobs.filter(j => (j.category || '').toLowerCase() === 'government').length);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 800;
  const steps = 30;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current = Math.min(Math.round(increment * step), target);
    el.textContent = current.toLocaleString();
    if (step >= steps) {
      clearInterval(timer);
      el.textContent = target.toLocaleString();
    }
  }, duration / steps);
}

// ==================== UI HELPERS ====================
function showLoading(show) {
  document.getElementById('loading-state').style.display = show ? 'block' : 'none';
}

function loadMoreJobs() {
  renderJobs(false);
}

function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateLastUpdated() {
  const now = new Date();
  document.getElementById('last-updated').textContent = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCompanyInitial(company) {
  if (!company) return '?';
  return company.charAt(0).toUpperCase();
}

function getTypeIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'remote': return '🏠';
    case 'on-site': case 'onsite': return '🏢';
    case 'hybrid': return '🔄';
    default: return '💼';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDaysSince(dateStr) {
  if (!dateStr) return 999;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

// Make functions globally accessible for onclick handlers
window.toggleBookmark = toggleBookmark;
window.removeFilter = removeFilter;
window.clearSearch = clearSearch;
window.clearAllFilters = clearAllFilters;
window.closeModal = closeModal;
