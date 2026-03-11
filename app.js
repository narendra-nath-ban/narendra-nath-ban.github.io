async function fetchPosts() {
  const response = await fetch('data/posts.json');
  if (!response.ok) throw new Error('Could not load posts');
  return response.json();
}

function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach((el) => {
    if (el.getAttribute('href') === current) {
      el.classList.add('active');
    }
  });
}

async function renderPostFeed(targetId, limit = null) {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = '<div class="card">Loading posts...</div>';
  try {
    const posts = await fetchPosts();
    const sorted = posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const list = typeof limit === 'number' ? sorted.slice(0, limit) : sorted;

    if (!list.length) {
      root.innerHTML = '<div class="card">No posts yet. Add your first post by creating a post page and registering it in data/posts.json.</div>';
      return;
    }

    root.innerHTML = list
      .map(
        (post, index) => `
          <a class="post-row" href="${post.url || `post.html?id=${encodeURIComponent(post.id)}`}">
            <div class="num">${String(index + 1).padStart(3, '0')}</div>
            <div>
              <h3 class="post-title">${post.title}</h3>
              <p class="post-summary">${post.summary || ''}</p>
            </div>
            <span class="chip">${post.type || 'Note'}</span>
          </a>
        `,
      )
      .join('');
  } catch (error) {
    root.innerHTML = `<div class="card">${error.message}</div>`;
  }
}

setActiveNav();
