// Vercel Serverless Function — Job Aggregation API
// Fetches jobs from free public APIs (Remotive) and filters for relevance

const EXCLUDE_TITLE_TERMS = [
  'senior', 'sr.', 'sr ', 'lead', 'principal', 'staff', 'distinguished',
  'director', 'vp', 'vice president', 'head of', 'chief', 'cto', 'cio',
  'architect', 'manager', 'fellow'
];

const EXCLUDE_EXPERIENCE = [
  '5+ years', '6+ years', '7+ years', '8+ years', '10+ years',
  '12+ years', '15+ years', '5 years', '6 years', '7 years'
];

const RELEVANT_CATEGORIES = [
  'software-dev',
  'data',
  'devops',
  'all-others'
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Cache for 1 hour, serve stale for 24 hours while revalidating
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category = '', search = '', limit = '50' } = req.query;

  try {
    const allJobs = [];

    // Fetch from Remotive API (free, no key needed)
    const categories = category ? [category] : RELEVANT_CATEGORIES;

    for (const cat of categories) {
      try {
        const url = `https://remotive.com/api/remote-jobs?category=${cat}&limit=${limit}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) continue;

        const data = await response.json();
        const jobs = (data.jobs || [])
          .filter(job => !shouldExclude(job))
          .map(job => transformRemotiveJob(job));

        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`Failed to fetch category ${cat}:`, err.message);
        continue;
      }
    }

    // Apply search filter if provided
    let filteredJobs = allJobs;
    if (search) {
      const q = search.toLowerCase();
      filteredJobs = allJobs.filter(job => {
        const text = `${job.title} ${job.company} ${job.location} ${(job.skills || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Deduplicate
    const seen = new Set();
    filteredJobs = filteredJobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return res.status(200).json({
      success: true,
      count: filteredJobs.length,
      lastUpdated: new Date().toISOString(),
      jobs: filteredJobs
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
}

function shouldExclude(job) {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();

  // Exclude by title
  if (EXCLUDE_TITLE_TERMS.some(term => title.includes(term))) return true;

  // Exclude by experience
  if (EXCLUDE_EXPERIENCE.some(term => title.includes(term) || desc.includes(term))) return true;

  // Exclude if requires masters/PhD
  if (desc.includes('masters required') || desc.includes('phd required') || desc.includes('doctorate required')) return true;

  return false;
}

function transformRemotiveJob(job) {
  return {
    id: `remotive-${job.id}`,
    title: job.title || 'Untitled Position',
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote — Worldwide',
    type: 'remote',
    category: 'private',
    salary: job.salary || 'Not disclosed',
    skills: (job.tags || []).slice(0, 8),
    experience: 'Not specified',
    postedDate: job.publication_date || new Date().toISOString().split('T')[0],
    applyUrl: job.url || '#',
    source: 'Remotive',
    description: job.description || 'No description available.',
    companyLogo: job.company_logo || ''
  };
}
