// Load navigation
fetch('/navigation.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navigation-placeholder').innerHTML = data;
        
        // Initialize navigation
        initializeNavigation();
        
        // Set up global link handling
        setupGlobalLinkHandling();
    })
    .catch(error => console.log('Navigation loading failed:', error));

// Function to initialize navigation highlighting
function initializeNavigation() {
    // Get current page from body data-page attribute
    const currentPage = document.body.getAttribute('data-page');
    
    // Set active page based on current page
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Function to set up global link handling
function setupGlobalLinkHandling() {
    // Use event delegation on document body to handle all links
    document.body.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Skip if no href
        if (!href) return;
        
        // Skip external links (http/https)
        if (href.startsWith('http://') || href.startsWith('https://')) return;
        
        // Skip mailto links
        if (href.startsWith('mailto:')) return;
        
        // Skip javascript links
        if (href.startsWith('javascript:')) return;
        
        // Skip anchor links (same page)
        if (href.startsWith('#')) return;
        
        // Skip if it's not an HTML file
        if (!href.endsWith('.html')) return;
        
        // This is an internal HTML link - handle it with SPA navigation
        e.preventDefault();
        
        const targetPage = getPageFromUrl(href);
        const currentPage = document.body.getAttribute('data-page');
        
        // Don't navigate if already on the current page
        if (targetPage === currentPage) {
            return;
        }
        
        // Load the target page content
        loadPageContent(href, targetPage);
    });
}

// Function to extract page name from URL
function getPageFromUrl(url) {
    const filename = url.split('/').pop().replace('.html', '');
    return filename === 'index' ? 'home' : filename;
}

// Function to load page content and replace main content
function loadPageContent(url, targetPage) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            // Parse the HTML to extract the main content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMainContent = doc.querySelector('main.container');
            
            if (newMainContent) {
                // Update the main content
                const currentMain = document.querySelector('main.container');
                if (currentMain) {
                    // Add fade out effect
                    currentMain.style.opacity = '0.5';
                    currentMain.style.transform = 'translateY(10px)';
                    
                    setTimeout(() => {
                        // Replace content
                        currentMain.innerHTML = newMainContent.innerHTML;
                        
                        // Update body data-page attribute
                        document.body.setAttribute('data-page', targetPage);
                        
                        // Update page title
                        const newTitle = doc.querySelector('title');
                        if (newTitle) {
                            document.title = newTitle.textContent;
                        }
                        
                        // Update navigation active state
                        initializeNavigation();
                        
                        // Reinitialize page functionality for SPA
                        if (window.initializePageFunctionality) {
                            window.initializePageFunctionality();
                        }
                        
                        // Reset scroll position to top
                        window.scrollTo(0, 0);
                        
                        // Fade in new content
                        currentMain.style.opacity = '1';
                        currentMain.style.transform = 'translateY(0)';
                        
                        // Update browser history
                        history.pushState({ page: targetPage }, '', url);
                        
                    }, 200);
                }
            }
        })
        .catch(error => {
            console.log('Failed to load page content:', error);
            // Fallback to normal navigation
            window.location.href = url;
        });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
        // Reload the page content based on the current URL
        const currentUrl = window.location.pathname;
        loadPageContent(currentUrl, e.state.page);
    } else {
        // Fallback: reload the page
        window.location.reload();
    }
});