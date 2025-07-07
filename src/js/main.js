import { Markdrown } from '/lib/markdrown/markdrown.js';
import { featuresPlugin } from '/lib/markdrown/plugins/features-plugin.js';
import { constellationPlugin } from '/lib/markdrown/plugins/constellation-plugin.js';
import { workflowStepsPlugin } from '/lib/markdrown/plugins/workflow-steps-plugin.js';

// === COMMON UTILS ===
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function lerp(a, b, t) { return a + (b - a) * t; }

// Parse OKLCH color string to components
function parseOKLCH(oklchString) {
    const match = oklchString.match(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)/);
    if (!match) throw new Error(`Invalid OKLCH color: ${oklchString}`);
    return {
        l: parseFloat(match[1]),
        c: parseFloat(match[2]),
        h: parseFloat(match[3])
    };
}

// Interpolate between two OKLCH colors
function lerpOKLCH(oklch1, oklch2, t) {
    const color1 = parseOKLCH(oklch1);
    const color2 = parseOKLCH(oklch2);
    
    // Handle hue interpolation (shortest path around color wheel)
    let h1 = color1.h;
    let h2 = color2.h;
    let deltaH = h2 - h1;
    
    if (deltaH > 180) deltaH -= 360;
    if (deltaH < -180) deltaH += 360;
    
    const interpolatedH = h1 + deltaH * t;
    const normalizedH = ((interpolatedH % 360) + 360) % 360;
    
    return `oklch(${lerp(color1.l, color2.l, t).toFixed(3)} ${lerp(color1.c, color2.c, t).toFixed(3)} ${normalizedH.toFixed(1)})`;
}

// ===== DYNAMIC PRIMARY COLOR (OKLCH unified palette) =====
const colorStopsOKLCH = [
  // 00:00 - Midnight Indigo
  "oklch(0.58 0.18 220)",
  // 01:00 - Deep Blue
  "oklch(0.60 0.20 240)",
  // 02:00 - Deep Night Blue
  "oklch(0.63 0.22 260)",
  // 03:00 - Pre-dawn Blue
  "oklch(0.64 0.22 265)",
  // 04:00 - Faint Dawn Blue
  "oklch(0.66 0.21 270)",
  // 05:00 - Hint of Gold Begins
  "oklch(0.75 0.22 45)",
  // 06:00 - Bright Gold
  "oklch(0.90 0.26 90)",
  // 07:00 - Full Morning Gold
  "oklch(0.97 0.29 105)",
  // 08:00 - Vivid Spring Green
  "oklch(0.85 0.24 130)",
  // 09:00 - Warming Cyan-Green
  "oklch(0.84 0.24 160)",
  // 10:00 - Sky Cyan
  "oklch(0.85 0.25 195)",
  // 11:00 - Daylight Cyan-Blue
  "oklch(0.87 0.25 210)",
  // 12:00 - Electric Blue
  "oklch(0.88 0.25 220)",
  // 13:00 - Clear Blue
  "oklch(0.84 0.25 230)",
  // 14:00 - Bold Blue
  "oklch(0.78 0.26 250)",
  // 15:00 - Azure Edge
  "oklch(0.75 0.25 260)",
  // 16:00 - Azure Boost
  "oklch(0.73 0.25 265)",
  // 17:00 - Evening Blue Tint
  "oklch(0.68 0.26 270)",
  // 18:00 - Cerulean Deep
  "oklch(0.60 0.26 275)",
  // 19:00 - Hints of Coral
  "oklch(0.68 0.26 20)",
  // 20:00 - Sunset Coral
  "oklch(0.78 0.27 35)",
  // 21:00 - Fading Coral
  "oklch(0.70 0.24 50)",
  // 22:00 - Night Violet
  "oklch(0.68 0.22 295)",
  // 23:00 - Rich Indigo
  "oklch(0.63 0.20 240)"
];


let debugDemoTime = null;
window.setDemoTime = function(hoursFloat) {
    debugDemoTime = hoursFloat;
    updatePrimaryColor();
};

function getLocalHoursFraction() {
    if (debugDemoTime !== null && !isNaN(debugDemoTime)) return debugDemoTime;
    const now = new Date();
    return now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600;
}

// MAIN: OKLCH-based unified color system
function updatePrimaryColor() {
    const hours = getLocalHoursFraction();
    const seg = 24 / colorStopsOKLCH.length;
    let idx = Math.floor(hours / seg);
    let nextIdx = (idx + 1) % colorStopsOKLCH.length;
    let t = (hours % seg) / seg;

    // Interpolate in OKLCH color space
    const oklchColor = lerpOKLCH(colorStopsOKLCH[idx], colorStopsOKLCH[nextIdx], t);
    
    // Set primary OKLCH color (works across all displays)
    document.documentElement.style.setProperty('--aurora-primary', oklchColor);
    
    // Set all alpha variants of the primary color
    const alphaValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    alphaValues.forEach(alpha => {
        const alphaDecimal = alpha / 100;
        const alphaColor = oklchColor.replace(')', ` / ${alphaDecimal})`);
        document.documentElement.style.setProperty(`--aurora-primary-a${alpha.toString().padStart(2, '0')}`, alphaColor);
    });


}
updatePrimaryColor();
setInterval(updatePrimaryColor, 300000);


// === PROFILE IMG SWITCH ===
async function initializeProfileImageSwitching() {
    const profileImg = document.querySelector('.profile-pic-highlight img');
    const profileContainer = document.querySelector('.profile-pic-highlight');
    if (profileImg && profileContainer) {
        const newProfileContainer = profileContainer.cloneNode(true);
        profileContainer.parentNode.replaceChild(newProfileContainer, profileContainer);
        const newProfileImg = newProfileContainer.querySelector('img');
        const originalSrc = newProfileImg.src;
        const alternateSrc = '/img/profile-alt.jpg';
        let isOriginal = true;

        newProfileContainer.addEventListener('click', async function(e) {
            e.preventDefault(); e.stopPropagation();
            if (this.style.pointerEvents === 'none') return;
            this.style.pointerEvents = 'none';
            this.style.transform = 'rotateY(90deg)';
            await sleep(150);
            newProfileImg.src = isOriginal ? alternateSrc : originalSrc;
            isOriginal = !isOriginal;
            await sleep(50);
            this.style.transform = 'rotateY(0deg)';
            await sleep(300);
            this.style.pointerEvents = 'auto';
        });
        newProfileContainer.style.cursor = 'pointer';
    }
}

// === TOOLS PAGE ===
function initializeToolsPage() {
    const toolNodes = document.querySelectorAll('.tool-node');
    const workflowSteps = document.querySelectorAll('.workflow-step');
    const insightCards = document.querySelectorAll('.insight-card');
    const detailsPanel = document.getElementById('toolDetailsPanel');
    const toolContents = document.querySelectorAll('.tool-content');
    toolNodes.forEach((node, index) => {
        node.addEventListener('click', async function() {
            const toolId = this.getAttribute('data-tool');
            toolContents.forEach(content => { content.style.display = 'none'; });
            const targetContent = document.querySelector(`.tool-content[data-tool="${toolId}"]`)
                || document.querySelector('.tool-content[data-tool="default"]');
            if (targetContent) {
                targetContent.style.display = 'block';
                toolNodes.forEach(n => n.classList.remove('selected'));
                this.classList.add('selected');
                detailsPanel.style.transform = 'translateY(10px)';
                detailsPanel.style.opacity = '0.7';
                await sleep(150);
                detailsPanel.style.transform = 'translateY(0)';
                detailsPanel.style.opacity = '1';
            }
        });
    });
    // Intersection Observer logic
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, observerOptions);
    workflowSteps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateX(-30px)';
        step.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(step);
    });
    insightCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// === MAIN PAGE INIT ===
function initializePageFunctionality() {
    initializeProfileImageSwitching();
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage === 'tools') {
        initializeToolsPage();
    }
    // Initialize blog functionality for any blog page
    if (currentPage && currentPage.startsWith('blog') && window.initializeBlogFunctionality) {
        window.initializeBlogFunctionality();
    }
}
window.initializePageFunctionality = initializePageFunctionality;

// Navigation fetch
(async () => {
    try {
        const response = await fetch('/navigation.html');
        const data = await response.text();
        document.getElementById('navigation-placeholder').innerHTML = data;
        initializeNavigation();
        if (window.lucide) lucide.createIcons();
        if (typeof hljs !== 'undefined') hljs.highlightAll();
        
        // Attach blog menu toggle handlers after navigation is loaded
        attachBlogMenuToggleHandlers();
    } catch (error) {
        console.log('Navigation loading failed:', error);
    }
})();

function initializeNavigation() {
    const currentPage = document.body.getAttribute('data-page');
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('data-page');
        // Handle blog page matching - any blog-* page should match the blog nav link
        if (linkPage === currentPage || (linkPage === 'blog' && currentPage && currentPage.startsWith('blog'))) {
            link.classList.add('active');
        }
    });
}

// DOMContentLoaded
window._onDomLoadedCallbacks = window._onDomLoadedCallbacks || [];
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializePageFunctionality === 'function') {
        initializePageFunctionality();
    }
    window._onDomLoadedCallbacks.forEach(function(cb) {
        try { cb(); } catch(e) { console.error(e); }
    });
});

// ==== BLOG VIEWER CODE (COMPLETE) ====
// Blog Viewer Implementation
let isRendering = false;

// Tab switching functionality
function switchTab(tabName) {
    // Get current tab buttons and panes (they might have changed during SPA navigation)
    const currentTabButtons = document.querySelectorAll('.tab-button');
    const currentTabPanes = document.querySelectorAll('.tab-pane');
    
    // Update tab buttons
    currentTabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    currentTabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
}


// Generate line numbers with wrapping support
function generateLineNumbers() {
    const currentSourceElement = document.getElementById('markdrown-source');
    const lineNumbersElement = document.getElementById('line-numbers');
    
    if (!currentSourceElement || !lineNumbersElement) {
        return; // Exit if required elements are not available
    }
    
    const sourceCode = currentSourceElement.querySelector('code');
    if (!sourceCode) {
        return; // Exit if code element is not available
    }
    
    // Simple approach: just show logical line numbers for now
    // This avoids the complex wrapping calculation that was causing issues
    const lines = sourceCode.textContent.split('\n');
    
    // Clear and rebuild line numbers
    lineNumbersElement.innerHTML = '';
    
    lines.forEach((line, index) => {
        const lineNumberDiv = document.createElement('div');
        lineNumberDiv.className = 'line-number logical-line';
        lineNumberDiv.textContent = index + 1;
        lineNumbersElement.appendChild(lineNumberDiv);
    });
}

// Function to update word and character count
function updateWordCharCount() {
    const currentSourceElement = document.getElementById('markdrown-source');
    const wordCountElement = document.getElementById('word-count');
    const charCountElement = document.getElementById('char-count');
    
    if (!currentSourceElement || !wordCountElement || !charCountElement) {
        return; // Exit if required elements are not available
    }
    
    const codeElement = currentSourceElement.querySelector('code');
    if (!codeElement) {
        return; // Exit if code element is not available
    }
    
    const markdrownContent = codeElement.textContent;
    
    // Count words (split by whitespace and filter out empty strings)
    const words = markdrownContent.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count characters (excluding whitespace)
    const charCount = markdrownContent.replace(/\s/g, '').length;
    
    wordCountElement.textContent = `${wordCount} words`;
    charCountElement.textContent = `${charCount} chars`;
}

// Render markdrown function
function render() {
    if (isRendering) return;
    
    // Get current elements (they might have changed during SPA navigation)
    const currentSourceElement = document.getElementById('markdrown-source');
    const currentOutput = document.getElementById('markdrown-output');
    
    if (!currentSourceElement || !currentOutput) {
        console.warn('Required markdrown elements not found for rendering');
        return;
    }
    
    isRendering = true;

    try {
        // Get markdrown content from the pre element
        const codeElement = currentSourceElement.querySelector('code');
        if (!codeElement) {
            console.warn('Code element not found in markdrown source');
            isRendering = false;
            return;
        }
        
        const markdrownContent = codeElement.textContent;
        const renderedHTML = mdParser.parse(markdrownContent);
        
        currentOutput.innerHTML = renderedHTML;
        console.log('Markdrown rendered successfully');
        mdParser.executePostRenderCallbacks(currentOutput);
        console.log('Post-render callbacks executed');

        // Update document meta tags from parsed metadata
        updateMetaTags(mdParser.metaHeader || {});
        
        // Update word and character count
        updateWordCharCount();
        
        // Generate line numbers for source view
        generateLineNumbers();
        
        // Apply syntax highlighting to code blocks
        // Highlight.js syntax highlighting for rendered content
        if (window.hljs) {
            const codeBlocks = currentOutput.querySelectorAll('pre code[class*="language-"]');
            codeBlocks.forEach(block => {
                block.removeAttribute('data-highlighted');
                hljs.highlightElement(block);
            });
        }
        
        // Highlight the markdrown source as well
        const sourceCode = currentSourceElement.querySelector('code');
        if (sourceCode && window.hljs) {
            sourceCode.removeAttribute('data-highlighted');
            hljs.highlightElement(sourceCode);
        }
        
        // Add copy buttons to code blocks
        addCopyButtonsToCodeBlocks();
        
        // Force Lucide icons to render after content update
        if (window.lucide && window.lucide.createIcons) {
            lucide.createIcons();
        }

        isRendering = false;
    } catch (e) {
        console.error('Error rendering markdrown:', e);
        currentOutput.innerHTML = "<pre style='color:crimson'>Error rendering markdrown: " + e.message + "</pre>";
        isRendering = false;
    }
}

// Function to update HTML meta tags from markdrown metadata
function updateMetaTags(metadata) {
    // Update document title
    if (metadata.title) {
        document.title = metadata.title + ' - bbelius.dev';
    }
    
    // Remove existing meta tags that we manage
    const existingMetas = document.querySelectorAll('meta[name="author"], meta[name="description"], meta[name="keywords"], meta[name="date"]');
    existingMetas.forEach(meta => meta.remove());
    
    // Add new meta tags
    if (metadata.author) {
        const authorMeta = document.createElement('meta');
        authorMeta.name = 'author';
        authorMeta.content = metadata.author;
        document.head.appendChild(authorMeta);
    }
    
    if (metadata.description) {
        const descMeta = document.createElement('meta');
        descMeta.name = 'description';
        descMeta.content = metadata.description;
        document.head.appendChild(descMeta);
    }
    
    if (metadata.tags) {
        const keywordsMeta = document.createElement('meta');
        keywordsMeta.name = 'keywords';
        const keywords = Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags;
        keywordsMeta.content = keywords;
        document.head.appendChild(keywordsMeta);
    }
    
    if (metadata.date) {
        const dateMeta = document.createElement('meta');
        dateMeta.name = 'date';
        dateMeta.content = metadata.date;
        document.head.appendChild(dateMeta);
    }
    
    // Update page header and titlebar with metadata
    updatePageHeader(metadata);
}

// Function to update page header and titlebar with metadata
function updatePageHeader(metadata) {
    const blogHeader = document.querySelector('header');
    const blogTitle = document.getElementById('blog-title');
    const blogSubtitle = document.getElementById('blog-subtitle');
    const blogAuthor = document.getElementById('blog-author');
    const blogDate = document.getElementById('blog-date');
    const tagsContainer = document.getElementById('tags-container');
    
    // Update main title
    if (metadata.title && blogTitle) {
        // Remove quotes from title
        const cleanTitle = metadata.title.replace(/^["']|["']$/g, '');
        blogTitle.textContent = cleanTitle;
    }
    
    // Update author and date in tags bar
    const authorLine = document.getElementById('blog-author-line');
    const dateLine = document.getElementById('blog-date-line');
    const metaInfo = document.getElementById('meta-info');
    
    if (metadata.author) {
        // Remove quotes from author name
        authorLine.textContent = metadata.author;
    }
    
    if (metadata.date) {
        // Convert to ISO format YYYY-MM-dd
        const isoDate = formatDateISO(metadata.date);
        dateLine.textContent = isoDate;
    }
    
    // Update tags in separate bar
    if (metadata.tags && tagsContainer) {
        let tags = [];
        if (Array.isArray(metadata.tags)) {
            tags = metadata.tags;
        } else if (typeof metadata.tags === 'string') {
            // Handle string representation of array like '["sample", "blog", "markdrown"]'
            try {
                tags = JSON.parse(metadata.tags);
            } catch (e) {
                // If parsing fails, treat as comma-separated string
                tags = metadata.tags.split(',').map(tag => tag.trim());
            }
        }
        
        if (tags.length > 0) {
            tagsContainer.innerHTML = tags.map(tag =>
                `<span class="tag clickable-tag" data-tag="${tag}">${tag}</span>`
            ).join('');
            
            // Add click event listeners to tags
            const tagElements = tagsContainer.querySelectorAll('.clickable-tag');
            tagElements.forEach(tagElement => {
                tagElement.addEventListener('click', (e) => {
                    const tagText = e.target.dataset.tag;
                    openMenuWithSearch(tagText);
                });
            });
        }
    }
}

// Function to format date to ISO format
function formatDateISO(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
}

const mdParser = new Markdrown();
mdParser.AddAllPlugins();
mdParser.addPlugin(featuresPlugin());
mdParser.addPlugin(constellationPlugin());
mdParser.addPlugin(workflowStepsPlugin());

// Function to initialize blog functionality (can be called during SPA navigation)
function initializeBlogFunctionality() {
    // Only initialize blog functionality on blog pages
    const currentPage = document.body.getAttribute('data-page');
    if (!currentPage || !currentPage.startsWith('blog')) {
        return; // Exit early if not on a blog page
    }
    
    // Wait for DOM elements to be available with a retry mechanism
    const initWithRetry = async (retries = 5) => {
        const sourceElement = document.getElementById('markdrown-source');
        const output = document.getElementById('markdrown-output');
        const blogMenuContainer = document.getElementById('blog-menu-container');
        
        if (!sourceElement || !output || !blogMenuContainer) {
            if (retries > 0) {
                await sleep(100);
                return initWithRetry(retries - 1);
            } else {
                console.warn('Blog elements not found after retries - skipping blog initialization');
                return;
            }
        }
        
        // All required elements are available, proceed with initialization
        render();
        initBlogMenu();
        initStickyControlsBar();
        setupMainControlsBarEventListeners();
    };
    
    // Start initialization with retry mechanism
    initWithRetry();
}

// Make the function globally available for SPA navigation
window.initializeBlogFunctionality = initializeBlogFunctionality;

window._onDomLoadedCallbacks = window._onDomLoadedCallbacks || [];
window._onDomLoadedCallbacks.push(function() {
    // Initialize blog functionality on initial page load
    initializeBlogFunctionality();
    attachBlogMenuToggleHandlers();
});

// Blog Menu Functionality
function initBlogMenu() {
    // Load menu HTML
    loadBlogMenu();
    
    // Initialize menu event listeners
    setupMenuEventListeners();
}

async function loadBlogMenu() {
    try {
        const response = await fetch('/menu.html');
        const menuHTML = await response.text();
        const menuContainer = document.getElementById('blog-menu-container');
        if (menuContainer) {
            menuContainer.innerHTML = menuHTML;
            
            // Initialize Lucide icons for the menu
            if (window.lucide && window.lucide.createIcons) {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Failed to load blog menu:', error);
    }
}

async function setupMenuEventListeners() {
    // Wait for menu to be loaded with proper Promise-based approach
    await waitForMenuElements();
    
    const menuToggles = document.querySelectorAll('.blog-menu-toggle');
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const menuSearch = document.getElementById('menu-search');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const postItems = document.querySelectorAll('.menu-post-item');
    
    if (menuToggles.length === 0 || !menuOverlay || !menuBackdrop) return;
        
        // Toggle menu (works on both desktop and mobile)
        menuToggles.forEach(menuToggle => {
            menuToggle.addEventListener('click', () => {
                toggleMenu();
            });
        });
        
        // Close menu
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', () => {
                closeMenu();
            });
        }
        
        // Close menu when clicking backdrop
        menuBackdrop.addEventListener('click', () => {
            closeMenu();
        });
        
        // Desktop hover behavior
        if (window.innerWidth > 768) {
            const hoverTrigger = document.getElementById('blog-menu-hover-trigger');
            let hoverTimeout;
            
            // Show menu on hover trigger
            if (hoverTrigger) {
                hoverTrigger.addEventListener('mouseenter', () => {
                    clearTimeout(hoverTimeout);
                    showMenuOnHover();
                });
                
                hoverTrigger.addEventListener('mouseleave', () => {
                    hoverTimeout = setTimeout(() => {
                        hideMenuOnHover();
                    }, 200);
                });
            }
            
            // Keep menu open when hovering over it
            menuOverlay.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                showMenuOnHover();
            });
            
            menuOverlay.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    hideMenuOnHover();
                }, 300);
            });
            
            // Also show menu on hover near left edge as fallback
            document.addEventListener('mousemove', (e) => {
                if (e.clientX <= 10) {
                    clearTimeout(hoverTimeout);
                    showMenuOnHover();
                } else if (e.clientX > 400 && !menuOverlay.matches(':hover')) {
                    hoverTimeout = setTimeout(() => {
                        hideMenuOnHover();
                    }, 500);
                }
            });
        }
        
        // Search functionality
        if (menuSearch) {
            const searchClearBtn = document.getElementById('search-clear-btn');
            
            menuSearch.addEventListener('input', (e) => {
                const searchValue = e.target.value;
                filterPosts(searchValue);
                
                // Show/hide clear button based on input content
                if (searchClearBtn) {
                    searchClearBtn.style.display = searchValue.length > 0 ? 'flex' : 'none';
                }
            });
            
            // Clear button functionality
            if (searchClearBtn) {
                searchClearBtn.addEventListener('click', () => {
                    menuSearch.value = '';
                    filterPosts('');
                    searchClearBtn.style.display = 'none';
                    menuSearch.focus();
                });
            }
        }
        
        // Category filtering
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Update active category
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                // Filter posts by category
                const category = filter.dataset.category;
                filterPostsByCategory(category);
            });
        });
        
        // Post item clicks
        postItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default navigation
                const slug = item.dataset.slug;
                if (slug) {
                    loadBlogPost(slug, item);
                    closeMenu(); // Close menu after navigation
                }
            });
        });
        
        // Escape key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        });
}

// Promise-based function to wait for menu elements to be available
function waitForMenuElements() {
    return new Promise((resolve) => {
        const checkElements = () => {
            const menuOverlay = document.getElementById('blog-menu-overlay');
            const menuBackdrop = document.getElementById('blog-menu-backdrop');
            const menuToggles = document.querySelectorAll('.blog-menu-toggle');
            
            if (menuOverlay && menuBackdrop && menuToggles.length > 0) {
                resolve();
            } else {
                setTimeout(checkElements, 100);
            }
        };
        checkElements();
    });
}

function toggleMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuToggles = document.querySelectorAll('.blog-menu-toggle');
    
    if (menuOverlay && menuBackdrop && menuToggles.length > 0) {
        const isActive = menuOverlay.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    }
}

function openMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuToggles = document.querySelectorAll('.blog-menu-toggle');
    const menuIndicator = document.getElementById('blog-menu-indicator');
    
    if (menuOverlay && menuBackdrop && menuToggles.length > 0) {
        menuOverlay.classList.add('active');
        menuBackdrop.classList.add('active');
        menuToggles.forEach(toggle => toggle.classList.add('active'));
        
        // Hide the indicator when menu is open
        if (menuIndicator) {
            menuIndicator.style.opacity = '0';
        }
        
        // Prevent body scroll on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
}

function closeMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuToggles = document.querySelectorAll('.blog-menu-toggle');
    const menuIndicator = document.getElementById('blog-menu-indicator');
    
    if (menuOverlay && menuBackdrop && menuToggles.length > 0) {
        menuOverlay.classList.remove('active');
        menuBackdrop.classList.remove('active');
        menuToggles.forEach(toggle => toggle.classList.remove('active'));
        
        // Also remove hover state on desktop
        menuOverlay.classList.remove('hover-active');
        
        // Restore the indicator visibility
        if (menuIndicator) {
            menuIndicator.style.opacity = '';
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

function showMenuOnHover() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    if (menuOverlay && window.innerWidth > 768) {
        menuOverlay.classList.add('hover-active');
    }
}

function hideMenuOnHover() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    if (menuOverlay && window.innerWidth > 768) {
        menuOverlay.classList.remove('hover-active');
    }
}

function filterPosts(searchTerm) {
    const postItems = document.querySelectorAll('.menu-post-item');
    const term = searchTerm.toLowerCase().trim();
    
    postItems.forEach(item => {
        const title = item.dataset.title?.toLowerCase() || '';
        const description = item.dataset.description?.toLowerCase() || '';
        const tags = item.dataset.tags?.toLowerCase() || '';
        
        const matches = title.includes(term) ||
                       description.includes(term) ||
                       tags.includes(term);
        
        item.style.display = matches ? 'block' : 'none';
    });
}

function filterPostsByCategory(category) {
    const postItems = document.querySelectorAll('.menu-post-item');
    
    postItems.forEach(item => {
        const postCategory = item.dataset.category;
        const shouldShow = category === 'all' || postCategory === category;
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// Function to open menu with prefilled search
async function openMenuWithSearch(searchText) {
    // Open the menu first
    openMenu();
    
    // Wait for the menu to be fully rendered, then set the search text
    await waitForSearchElements();
    
    const menuSearch = document.getElementById('menu-search');
    const searchClearBtn = document.getElementById('search-clear-btn');
    
    if (menuSearch) {
        menuSearch.value = searchText;
        // Trigger the search functionality
        filterPosts(searchText);
        
        // Show clear button since we have search text
        if (searchClearBtn && searchText.length > 0) {
            searchClearBtn.style.display = 'flex';
        }
        
        // Focus the search input for better UX
        menuSearch.focus();
    }
}

// Promise-based function to wait for search elements to be available
function waitForSearchElements() {
    return new Promise((resolve) => {
        const checkElements = () => {
            const menuSearch = document.getElementById('menu-search');
            if (menuSearch) {
                resolve();
            } else {
                setTimeout(checkElements, 50);
            }
        };
        checkElements();
    });
}

// Function to add copy buttons and line numbers to all code blocks
function addCopyButtonsToCodeBlocks() {
    // Find all pre elements that contain code
    const codeBlocks = document.querySelectorAll('.markdrown-content pre');
    
    codeBlocks.forEach(pre => {
        // Skip if already processed
        if (pre.parentElement.classList.contains('code-block-container')) {
            return;
        }
        
        // Get the code content and split into lines
        const codeElement = pre.querySelector('code');
        const codeText = codeElement ? codeElement.textContent : pre.textContent;
        const lines = codeText.split('\n');
        
        // Remove empty last line if it exists (common with code blocks)
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        // Create container wrapper
        const container = document.createElement('div');
        container.className = 'code-block-container';
        
        // Check if code block has filename
        const hasFilename = pre.hasAttribute('data-filename');
        if (hasFilename) {
            container.classList.add('has-filename');
        }
        
        // Create the lined code block structure
        const linedCodeBlock = document.createElement('div');
        linedCodeBlock.className = 'code-block-with-lines';
        
        if (hasFilename) {
            linedCodeBlock.classList.add('has-filename');
            linedCodeBlock.setAttribute('data-filename', pre.getAttribute('data-filename'));
        }
        
        // Create line numbers container
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'code-line-numbers';
        
        // Generate line numbers
        for (let i = 1; i <= lines.length; i++) {
            const lineNumber = document.createElement('span');
            lineNumber.className = 'line-number';
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }
        
        // Clone the pre element and update its structure
        const newPre = pre.cloneNode(true);
        
        // Add classes to indicate this has line numbers
        container.classList.add('has-lines');
        
        // Wrap the pre element
        pre.parentNode.insertBefore(container, pre);
        
        // Build the lined structure
        linedCodeBlock.appendChild(lineNumbers);
        linedCodeBlock.appendChild(newPre);
        container.appendChild(linedCodeBlock);
        
        // Remove the original pre element
        pre.remove();
        
        // Create copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        copyBtn.innerHTML = `
            <i data-lucide="copy" class="copy-icon"></i>
            <span class="copy-text">Copy</span>
        `;
        
        // Add click handler with proper async/await error handling
        copyBtn.addEventListener('click', async () => {
            await handleCopyButtonClick(copyBtn, newPre);
        });
        
        // Add button to container
        container.appendChild(copyBtn);
    });
}

// Separate async function to handle copy button click with proper error handling
async function handleCopyButtonClick(copyBtn, preElement) {
    try {
        // Get the code content
        const codeElement = preElement.querySelector('code');
        const codeText = codeElement ? codeElement.textContent : preElement.textContent;
        
        // Copy to clipboard using modern API
        await copyToClipboard(codeText);
        
        // Update button state to show success
        await updateCopyButtonState(copyBtn, 'success');
        
        // Reset button state after delay
        await delay(2000);
        await updateCopyButtonState(copyBtn, 'default');
        
    } catch (err) {
        console.error('Failed to copy code:', err);
        
        // Try fallback method for older browsers
        try {
            const codeElement = preElement.querySelector('code');
            const codeText = codeElement ? codeElement.textContent : preElement.textContent;
            await copyToClipboardFallback(codeText);
            
            // Update button state to show success
            await updateCopyButtonState(copyBtn, 'success');
            
            // Reset button state after delay
            await delay(2000);
            await updateCopyButtonState(copyBtn, 'default');
            
        } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr);
            
            // Show error state
            await updateCopyButtonState(copyBtn, 'error');
            
            // Reset button state after delay
            await delay(2000);
            await updateCopyButtonState(copyBtn, 'default');
        }
    }
}

// Promise-based clipboard copy function
async function copyToClipboard(text) {
    if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
    }
    return navigator.clipboard.writeText(text);
}

// Fallback clipboard copy function for older browsers
async function copyToClipboardFallback(text) {
    return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                resolve();
            } else {
                reject(new Error('execCommand copy failed'));
            }
        } catch (err) {
            document.body.removeChild(textArea);
            reject(err);
        }
    });
}

// Update copy button state with proper icon rendering
async function updateCopyButtonState(copyBtn, state) {
    const textSpan = copyBtn.querySelector('.copy-text');
    const icon = copyBtn.querySelector('.copy-icon');
    
    switch (state) {
        case 'success':
            copyBtn.classList.add('copied');
            textSpan.textContent = 'Copied!';
            icon.setAttribute('data-lucide', 'check');
            break;
        case 'error':
            copyBtn.classList.add('error');
            textSpan.textContent = 'Error';
            icon.setAttribute('data-lucide', 'x');
            break;
        case 'default':
        default:
            copyBtn.classList.remove('copied', 'error');
            textSpan.textContent = 'Copy';
            icon.setAttribute('data-lucide', 'copy');
            break;
    }
    
    // Re-render the icon
    if (window.lucide && window.lucide.createIcons) {
        lucide.createIcons();
    }
}

// Initialize sticky controls bar functionality
async function initStickyControlsBar() {
    const controlsBar = document.querySelector('.controls-bar');
    const header = document.querySelector('header');
    
    if (!controlsBar || !header) return;
    
    // Wait for navigation to be loaded before proceeding
    const navContainer = await waitForNavigation();
    
    // Navigation is loaded, proceed with initialization
    setupStickyControls(controlsBar, header, navContainer);
}

// Promise-based function to wait for navigation to be available
function waitForNavigation() {
    return new Promise((resolve) => {
        const checkNavigation = () => {
            const navContainer = document.querySelector('.nav-container');
            if (navContainer) {
                resolve(navContainer);
            } else {
                setTimeout(checkNavigation, 100);
            }
        };
        checkNavigation();
    });
}

// Separate function to set up sticky controls once navigation is available
function setupStickyControls(controlsBar, header, navContainer) {
    
    // Store original parent and position for restoration
    const originalParent = controlsBar.parentElement;
    
    // Track current state
    let isSticky = false;
    
    // Function to setup event listeners for sticky controls
    function setupStickyControlsEventListeners(stickyControlsBar) {
        // Tab button functionality
        const stickyTabButtons = stickyControlsBar.querySelectorAll('.tab-button');
        stickyTabButtons.forEach(button => {
            // Check if handler is already attached to avoid duplicates
            if (button.hasAttribute('data-handler-attached')) {
                return;
            }
            
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Update all tab buttons (both main and sticky)
                const allTabButtons = document.querySelectorAll('.tab-button');
                allTabButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === tabName);
                });
                
                // Switch tab content
                switchTab(tabName);
            });
            
            // Mark as having handler attached
            button.setAttribute('data-handler-attached', 'true');
        });
        
        // Menu toggle functionality
        const stickyMenuToggles = stickyControlsBar.querySelectorAll('.blog-menu-toggle');
        stickyMenuToggles.forEach(stickyMenuToggle => {
            // Check if handler is already attached to avoid duplicates
            if (stickyMenuToggle.hasAttribute('data-handler-attached')) {
                return;
            }
            
            stickyMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu();
            });
            
            // Mark as having handler attached
            stickyMenuToggle.setAttribute('data-handler-attached', 'true');
        });
        
        // Initialize Lucide icons for the cloned elements
        if (window.lucide && window.lucide.createIcons) {
            lucide.createIcons();
        }
    }
    
    // Set up event listeners for the sticky controls bar in navigation
    const navStickyControlsBar = navContainer.querySelector('.controls-bar');
    if (navStickyControlsBar) {
        setupStickyControlsEventListeners(navStickyControlsBar);
    }
    
    // Create intersection observer to detect when header goes out of view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Add safety check to ensure we're still on a blog page
            const currentUrl = window.location.pathname;
            
            // Additional safety checks for DOM elements
            if (!controlsBar.parentElement || !navContainer.parentElement) {
                return; // Exit if elements are no longer in DOM
            }
            
            if (entry.isIntersecting) {
                // Header is visible - hide sticky controls
                const stickyControls = navContainer.querySelector('.controls-bar');
                if (stickyControls) {
                    stickyControls.classList.add('hidden');
                }
                isSticky = false;
            } else {
                // Header is not visible - show sticky controls
                const stickyControls = navContainer.querySelector('.controls-bar');
                if (stickyControls) {
                    stickyControls.classList.remove('hidden');
                }
                isSticky = true;
            }
        });
    }, {
        // Trigger when header is completely out of view
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px'
    });
    
    // Store observer reference for potential cleanup
    stickyControlsObserver = observer;
    
    // Start observing the header
    observer.observe(header);
    
    // Handle window resize to ensure proper layout
    window.addEventListener('resize', () => {
        if (isSticky) {
            // Force re-evaluation on resize
            const rect = header.getBoundingClientRect();
            if (rect.bottom > 0) {
                moveToOriginal();
            }
        }
    });
}

let stickyControlsObserver = null;

function attachBlogMenuToggleHandlers() {
    // Only attach handlers if we're on a blog page
    const currentUrl = window.location.pathname;
    if (!currentUrl.startsWith('/blog')) {
        return;
    }
    
    document.querySelectorAll('.blog-menu-toggle').forEach(btn => {
        // Check if handler is already attached to avoid duplicates
        if (btn.hasAttribute('data-handler-attached')) {
            return;
        }
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
        
        // Mark as having handler attached
        btn.setAttribute('data-handler-attached', 'true');
    });
}

// Function to setup event listeners for the main controls bar
function setupMainControlsBarEventListeners() {
    const mainControlsBar = document.querySelector('main .controls-bar');
    if (!mainControlsBar) return;
    
    // Tab button functionality for main controls bar
    const mainTabButtons = mainControlsBar.querySelectorAll('.tab-button');
    mainTabButtons.forEach(button => {
        // Check if handler is already attached to avoid duplicates
        if (button.hasAttribute('data-handler-attached')) {
            return;
        }
        
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update all tab buttons (both main and sticky)
            const allTabButtons = document.querySelectorAll('.tab-button');
            allTabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            
            // Switch tab content
            switchTab(tabName);
        });
        
        // Mark as having handler attached
        button.setAttribute('data-handler-attached', 'true');
    });
    
    // Menu toggle functionality for main controls bar
    const mainMenuToggles = mainControlsBar.querySelectorAll('.blog-menu-toggle');
    mainMenuToggles.forEach(menuToggle => {
        // Check if handler is already attached to avoid duplicates
        if (menuToggle.hasAttribute('data-handler-attached')) {
            return;
        }
        
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
        
        // Mark as having handler attached
        menuToggle.setAttribute('data-handler-attached', 'true');
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    // Close menu on resize to desktop
    if (window.innerWidth > 768) {
        closeMenu();
        document.body.style.overflow = '';
    }
});
