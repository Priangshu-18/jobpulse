const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'description']
  }
});

const DB_PATH = path.join(__dirname, '..', 'jobs-database.json');

const EXCLUDE_TITLES = [
  'senior', 'sr.', 'sr ', 'lead', 'principal', 'staff', 'director', 'vp', 
  'vice president', 'head of', 'chief', 'cto', 'architect', 'manager'
];

const EXCLUDE_DESC = [
  'masters required', 'phd required', 'doctorate required', 'm.tech required',
  'mtech required', 'post graduate required', 'postgraduation required', 'pg required'
];

// Keywords matching user's CSE skills or basic computer skills
const INCLUDE_KEYWORDS = [
  // CSE / Development
  'developer', 'engineer', 'react', 'node', 'python', 'django', 'fastapi', 
  'javascript', 'typescript', 'mongodb', 'mysql', 'sql', 'php', 'web', 'software',
  'data scientist', 'data analyst', 'ai', 'ml', 'machine learning', 'devops',
  // Basic Computer / Clerk
  'excel', 'word', 'typing', 'data entry', 'clerk', 'office assistant', 
  'computer operator', 'office executive', 'billing', 'tally', 'back office'
];

async function updateJobs() {
  console.log('Starting job update script...');

  // 1. Read existing jobs database
  let dbData = { jobs: [] };
  if (fs.existsSync(DB_PATH)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (!Array.isArray(dbData.jobs)) {
        dbData.jobs = dbData.jobs ? Object.values(dbData.jobs) : [];
      }
    } catch (e) {
      console.error('Error reading jobs database, starting fresh:', e.message);
    }
  }

  const existingCount = dbData.jobs.length;
  console.log(`Loaded ${existingCount} existing jobs from database.`);

  // 2. Fetch new jobs from RSS feeds
  const feeds = [
    { url: 'https://govtjobsblog.in/feed', name: 'Govt Jobs Blog', category: 'government' },
    { url: 'https://haryanajobs.in/category/latest-jobs/feed', name: 'HaryanaJobs National', category: 'government' }
  ];

  let newJobsCount = 0;
  const processedUrls = new Set(dbData.jobs.map(j => j.applyUrl));

  for (const feed of feeds) {
    console.log(`Fetching RSS feed: ${feed.name} (${feed.url})...`);
    try {
      const feedData = await parser.parseURL(feed.url);
      console.log(`Fetched ${feedData.items.length} items from ${feed.name}`);

      for (const item of feedData.items) {
        const title = item.title || '';
        const desc = item['content:encoded'] || item.content || item.contentSnippet || item.description || '';
        const url = item.link || '';

        // Avoid duplicates by URL
        if (processedUrls.has(url)) continue;

        // Apply qualification and role filters
        if (shouldFilterOut(title, desc)) continue;

        // Map to our job structure
        const job = transformRssItem(item, feed);
        if (job) {
          dbData.jobs.unshift(job); // Prepend new jobs
          processedUrls.add(url);
          newJobsCount++;
        }
      }
    } catch (err) {
      console.error(`Error processing feed ${feed.name}:`, err.message);
    }
  }

  console.log(`Fetched and validated ${newJobsCount} new job listings.`);

  // 3. Keep database sizes managed (cleanup posts older than 45 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 45);

  const initialCount = dbData.jobs.length;
  dbData.jobs = dbData.jobs.filter(job => {
    // Keep manual curated posts (prefixed with cur-), delete old scraped posts
    if (job.id && job.id.startsWith('cur-')) return true;
    
    try {
      const posted = new Date(job.postedDate);
      return posted >= cutoffDate;
    } catch {
      return true; // Keep if date is unparseable
    }
  });

  const removedCount = initialCount - dbData.jobs.length;
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} listings older than 45 days.`);
  }

  // 4. Save back to database
  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  console.log(`Successfully updated database. Total job listings: ${dbData.jobs.length}`);
}

function shouldFilterOut(title, desc) {
  const t = title.toLowerCase();
  const d = desc.toLowerCase();

  // 1. Title exclusion (Senior roles)
  if (EXCLUDE_TITLES.some(term => t.includes(term))) return true;

  // 2. Education level exclusion (Masters / PhD)
  if (EXCLUDE_DESC.some(term => d.includes(term))) return true;

  // 3. Check if at least one keyword matches what the user is looking for
  const matchesKeyword = INCLUDE_KEYWORDS.some(kw => t.includes(kw) || d.includes(kw));
  if (!matchesKeyword) return true;

  return false;
}

function transformRssItem(item, feed) {
  const title = item.title || '';
  const dateStr = item.isoDate || item.pubDate || new Date().toISOString();
  const postedDate = dateStr.split('T')[0];
  
  // Extract location or fallback to general regions
  let location = 'Pan India';
  const tLower = title.toLowerCase();
  if (tLower.includes('gujarat') || tLower.includes('surat') || tLower.includes('ahmedabad') || tLower.includes('gandhinagar')) {
    location = 'Gujarat';
  } else if (tLower.includes('mumbai') || tLower.includes('maharashtra') || tLower.includes('pune')) {
    location = 'Mumbai/Maharashtra';
  } else if (tLower.includes('kolkata') || tLower.includes('bengal') || tLower.includes('west bengal')) {
    location = 'Kolkata, WB';
  } else if (tLower.includes('delhi') || tLower.includes('noida') || tLower.includes('gurugram') || tLower.includes('ncr')) {
    location = 'Delhi NCR';
  }

  // Determine experience level
  let experience = 'Graduate / Entry Level';
  if (tLower.includes('fresher')) experience = 'Fresher';
  else if (tLower.includes('experience') || tLower.includes('years')) {
    const match = title.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*years/i);
    if (match) experience = `${match[1]}-${match[2]} years`;
  }

  // Parse list of matching skills from text
  const skills = [];
  INCLUDE_KEYWORDS.forEach(kw => {
    if (tLower.includes(kw)) {
      skills.push(capitalizeFirst(kw));
    }
  });

  return {
    id: `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: title,
    company: feed.name,
    location: location,
    type: tLower.includes('remote') || tLower.includes('wfh') ? 'remote' : 'on-site',
    category: feed.category,
    salary: 'Government Pay Scale / As per rules',
    skills: skills.slice(0, 5),
    experience: experience,
    postedDate: postedDate,
    applyUrl: item.link || '#',
    source: feed.name,
    description: item.contentSnippet || item.description || title
  };
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Execute
updateJobs();
