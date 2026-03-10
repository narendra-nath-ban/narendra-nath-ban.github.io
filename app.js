async function fetchPosts() {
  const response = await fetch('/api/posts');
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
    const list = typeof limit === 'number' ? posts.slice(0, limit) : posts;

    if (!list.length) {
      root.innerHTML = '<div class="card">No posts yet. Add your first post from the admin panel.</div>';
      return;
    }

    root.innerHTML = list
      .map(
        (post, index) => `
          <a class="post-row" href="post.html?id=${encodeURIComponent(post.id)}">
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

async function renderPostDetail() {
  const root = document.getElementById('postDetail');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    root.innerHTML = '<div class="card">Missing post id.</div>';
    return;
  }

  root.innerHTML = '<div class="card">Loading post...</div>';
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`);
    if (!response.ok) {
      root.innerHTML = '<div class="card">Post not found.</div>';
      return;
    }

    const post = await response.json();
    root.innerHTML = `
      <article class="card prose">
        <div class="meta">${post.type || 'Note'} · ${new Date(post.publishedAt).toLocaleDateString()}</div>
        <h1 class="page-title" style="font-size:clamp(2rem,7vw,4rem)">${post.title}</h1>
        <p class="lead" style="border-left-width:2px">${post.summary || ''}</p>
        <p>${(post.content || '').replace(/\n/g, '<br>')}</p>
      </article>
    `;
  } catch {
    root.innerHTML = '<div class="card">Unable to load post.</div>';
  }
}

setActiveNav();
renderPostDetail();
