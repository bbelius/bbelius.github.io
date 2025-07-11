import { Markdrown } from '/lib/markdrown/markdrown.js';
import { featuresPlugin } from '/lib/markdrown/plugins/features-plugin.js';
import { constellationPlugin } from '/lib/markdrown/plugins/constellation-plugin.js';
import { workflowStepsPlugin } from '/lib/markdrown/plugins/workflow-steps-plugin.js';
import { factsPlugin } from '/lib/markdrown/plugins/facts-plugin.js';

// === COMMON UTILS ===
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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
    "oklch(0.58 0.18 220)", // 00:00 - Midnight Indigo
    "oklch(0.60 0.20 240)", // 01:00 - Deep Blue
    "oklch(0.63 0.22 260)", // 02:00 - Deep Night Blue
    "oklch(0.64 0.22 265)", // 03:00 - Pre-dawn Blue
    "oklch(0.66 0.21 270)", // 04:00 - Faint Dawn Blue
    "oklch(0.75 0.22 45)",  // 05:00 - Hint of Gold Begins
    "oklch(0.90 0.26 90)",  // 06:00 - Bright Gold
    "oklch(0.97 0.29 105)", // 07:00 - Full Morning Gold
    "oklch(0.85 0.24 130)", // 08:00 - Vivid Spring Green
    "oklch(0.84 0.24 160)", // 09:00 - Warming Cyan-Green
    "oklch(0.85 0.25 195)", // 10:00 - Sky Cyan
    "oklch(0.87 0.25 210)", // 11:00 - Daylight Cyan-Blue
    "oklch(0.88 0.25 220)", // 12:00 - Electric Blue
    "oklch(0.84 0.25 230)", // 13:00 - Clear Blue
    "oklch(0.78 0.26 250)", // 14:00 - Bold Blue
    "oklch(0.75 0.25 260)", // 15:00 - Azure Edge
    "oklch(0.73 0.25 265)", // 16:00 - Azure Boost
    "oklch(0.68 0.26 270)", // 17:00 - Evening Blue Tint
    "oklch(0.60 0.26 275)", // 18:00 - Cerulean Deep
    "oklch(0.68 0.26 20)",  // 19:00 - Hints of Coral
    "oklch(0.78 0.27 35)",  // 20:00 - Sunset Coral
    "oklch(0.70 0.24 50)",  // 21:00 - Fading Coral
    "oklch(0.68 0.22 295)", // 22:00 - Night Violet
    "oklch(0.63 0.20 240)"  // 23:00 - Rich Indigo
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

function updatePrimaryColor() {
    const hours = getLocalHoursFraction();
    const seg = 24 / colorStopsOKLCH.length;
    let idx = Math.floor(hours / seg);
    let nextIdx = (idx + 1) % colorStopsOKLCH.length;
    let t = (hours % seg) / seg;

    // Interpolate in OKLCH color space
    const oklchColor = lerpOKLCH(colorStopsOKLCH[idx], colorStopsOKLCH[nextIdx], t);
    
    // Set primary OKLCH color
    document.documentElement.style.setProperty('--aurora-primary', oklchColor);
    
    // Set all alpha variants of the primary color
    const alphaValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    alphaValues.forEach(alpha => {
        const alphaDecimal = alpha / 100;
        const alphaColor = oklchColor.replace(')', ` / ${alphaDecimal})`);
        document.documentElement.style.setProperty(`--aurora-primary-a${alpha.toString().padStart(2, '0')}`, alphaColor);
    });
}

// Initialize color system
updatePrimaryColor();
setInterval(updatePrimaryColor, 300000);

// === PROFILE IMG SWITCH ===
function initializeProfileImageSwitching() {
    const profileImg = document.querySelector('.profile-pic-highlight img');
    const profileContainer = document.querySelector('.profile-pic-highlight');
    
    if (!profileImg || !profileContainer) return;
    
    const originalSrc = profileImg.src;
    const alternateSrc = '/img/profile-alt.jpg';
    let isOriginal = true;

    profileContainer.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.style.pointerEvents === 'none') return;
        
        this.style.pointerEvents = 'none';
        this.style.transform = 'rotateY(90deg)';
        
        await sleep(150);
        profileImg.src = isOriginal ? alternateSrc : originalSrc;
        isOriginal = !isOriginal;
        
        await sleep(50);
        this.style.transform = 'rotateY(0deg)';
        
        await sleep(300);
        this.style.pointerEvents = 'auto';
    });
    
    profileContainer.style.cursor = 'pointer';
}

// === NAVIGATION ===
async function loadNavigation() {
    try {
        const response = await fetch('/navigation.html');
        if (!response.ok) throw new Error(`Navigation fetch failed: ${response.status}`);
        
        const data = await response.text();
        const navigationPlaceholder = document.getElementById('navigation-placeholder');
        
        if (navigationPlaceholder) {
            navigationPlaceholder.innerHTML = data;
            initializeNavigation();
            
            if (window.lucide) lucide.createIcons();
            
            // Always initialize blog functionality
            initializeBlogFunctionality();
        }
    } catch (error) {
        console.warn('Navigation loading failed:', error);
        if (window.lucide) lucide.createIcons();
        
        // Still try to initialize blog functionality even if navigation fails
        initializeBlogFunctionality();
    }
}

function initializeNavigation() {
    const currentPage = document.body.getAttribute('data-page');
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('data-page');
        
        // Handle blog page matching
        if (linkPage === currentPage || (linkPage === 'blog' && currentPage && currentPage.startsWith('blog'))) {
            link.classList.add('active');
        }
    });
}

// === BLOG FUNCTIONALITY ===
let isRendering = false;
const mdParser = new Markdrown();
mdParser.AddAllPlugins();
mdParser.addPlugin(featuresPlugin());
mdParser.addPlugin(constellationPlugin());
mdParser.addPlugin(workflowStepsPlugin());
mdParser.addPlugin(factsPlugin());

function initializeBlogFunctionality() {
    // Always initialize blog functionality if blog elements exist
    const checkElements = () => {
        const sourceElement = document.getElementById('markdrown-source');
        const output = document.getElementById('markdrown-output');
        
        if (sourceElement && output) {
            render();
            initBlogMenu();
            initStickyControlsBar();
            setupControlsEventListeners();
        } else {
            // If blog elements don't exist, still initialize menu and basic functionality
            initBlogMenu();
            setupBasicEventListeners();
        }
    };
    
    checkElements();
}

// Tab switching
function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
}

// Generate line numbers
function generateLineNumbers() {
    const sourceElement = document.getElementById('markdrown-source');
    const lineNumbersElement = document.getElementById('line-numbers');
    
    if (!sourceElement || !lineNumbersElement) return;
    
    const sourceCode = sourceElement.querySelector('code');
    if (!sourceCode) return;
    
    const lines = sourceCode.textContent.split('\n');
    lineNumbersElement.innerHTML = '';
    
    lines.forEach((line, index) => {
        const lineNumberDiv = document.createElement('div');
        lineNumberDiv.className = 'line-number logical-line';
        lineNumberDiv.textContent = index + 1;
        lineNumbersElement.appendChild(lineNumberDiv);
    });
}

// Update word and character count
function updateWordCharCount() {
    const sourceElement = document.getElementById('markdrown-source');
    if (!sourceElement) return;
    
    const codeElement = sourceElement.querySelector('code');
    if (!codeElement) return;
    
    const markdrownContent = codeElement.textContent;
    
    // Count words
    const words = markdrownContent.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count characters (excluding whitespace)
    const charCount = markdrownContent.replace(/\s/g, '').length;
    
    // Update elements
    document.querySelectorAll('[data-role="word-count"]').forEach(element => {
        element.textContent = `${wordCount} words`;
    });
    
    document.querySelectorAll('[data-role="char-count"]').forEach(element => {
        element.textContent = `${charCount} chars`;
    });
}

// Render markdrown
function render() {
    if (isRendering) return;
    
    const sourceElement = document.getElementById('markdrown-source');
    const output = document.getElementById('markdrown-output');
    
    if (!sourceElement || !output) return;
    
    isRendering = true;

    try {
        const codeElement = sourceElement.querySelector('code');
        if (!codeElement) {
            isRendering = false;
            return;
        }
        
        const markdrownContent = codeElement.textContent;
        const renderedHTML = mdParser.parse(markdrownContent);
        
        output.innerHTML = renderedHTML;
        mdParser.executePostRenderCallbacks(output);
        
        updateWordCharCount();
        generateLineNumbers();
        
        // Apply syntax highlighting
        if (window.hljs) {
            const codeBlocks = output.querySelectorAll('pre code[class*="language-"]');
            codeBlocks.forEach(block => {
                block.removeAttribute('data-highlighted');
                hljs.highlightElement(block);
            });
            
            const sourceCode = sourceElement.querySelector('code');
            if (sourceCode) {
                sourceCode.removeAttribute('data-highlighted');
                hljs.highlightElement(sourceCode);
            }
        }
        
        addCopyButtonsToCodeBlocks();
        
        if (window.lucide) lucide.createIcons();
        
        isRendering = false;
    } catch (e) {
        console.error('Error rendering markdrown:', e);
        output.innerHTML = `<pre style='color:crimson'>Error rendering markdrown: ${e.message}</pre>`;
        isRendering = false;
    }
}

// === BLOG MENU ===
async function initBlogMenu() {
    await loadBlogMenu();
    setupMenuEventListeners();
}

function generateBlogPostsHTML() {
    const postItems = document.querySelectorAll('.menu-post-item');
    
    console.log(`Found ${postItems.length} menu post items`);
    
    postItems.forEach((item, index) => {
        const title = item.dataset.title || '';
        const author = item.dataset.author || '';
        const date = item.dataset.date || '';
        const description = item.dataset.description || '';
        const tags = item.dataset.tags || '';
        const category = item.dataset.category || '';
        const slug = item.dataset.slug || '';
        const type = item.dataset.type || category || 'post';
        
        console.log(`Processing item ${index}:`, { title, slug, category, tags });
        
        // Parse tags - handle JSON array format or comma-separated strings
        let tagArray = [];
        if (tags) {
            try {
                // Try to parse as JSON array first
                tagArray = JSON.parse(tags);
            } catch (e) {
                // If JSON parsing fails, treat as comma-separated string
                tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }
        
        // Generate tags HTML
        const tagsHTML = tagArray.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        // Create the HTML content - ALWAYS generate, overwrite any existing content
        const htmlContent = `
            <div class="post-meta">
                <span class="post-date">${date}</span>
                <span class="post-category">${category}</span>
            </div>
            <h4 class="post-title">${title}</h4>
            <p class="post-excerpt">${description}</p>
            <div class="post-tags">
                ${tagsHTML}
            </div>
        `;
        
        item.innerHTML = htmlContent;
        
        // Add click handler for navigation directly to each item
        item.addEventListener('click', () => {
            if (slug) {
                console.log(`Navigating to: /${slug}`);
                window.location.href = `/${slug}`;
                closeMenu();
            }
        });
    });
}

async function loadBlogMenu() {
    try {
        const response = await fetch('/menu.html');
        if (!response.ok) {
            throw new Error(`Menu fetch failed: ${response.status}`);
        }
        
        const menuHTML = await response.text();
        const menuContainer = document.getElementById('blog-menu-container');
        
        if (menuContainer) {
            menuContainer.innerHTML = menuHTML;
            
            // Wait a bit for DOM to settle, then generate HTML and setup handlers
            setTimeout(() => {
                generateBlogPostsHTML();
                if (window.lucide) lucide.createIcons();
            }, 100);
        }
    } catch (error) {
        console.error('Failed to load blog menu:', error);
    }
}

function setupMenuEventListeners() {
    const menuToggle = document.querySelector('.blog-menu-toggle');
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const menuSearch = document.getElementById('menu-search');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const postItems = document.querySelectorAll('.menu-post-item');
    
    if (!menuToggle || !menuOverlay || !menuBackdrop) return;
    
    // Toggle menu
    menuToggle.addEventListener('click', toggleMenu);
    
    // Close menu
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', closeMenu);
    }
    
    menuBackdrop.addEventListener('click', closeMenu);
    
    // Desktop hover behavior
    if (window.innerWidth > 768) {
        const hoverTrigger = document.getElementById('blog-menu-hover-trigger');
        let hoverTimeout;
        
        if (hoverTrigger) {
            hoverTrigger.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                showMenuOnHover();
            });
            
            hoverTrigger.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(hideMenuOnHover, 200);
            });
        }
        
        menuOverlay.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            showMenuOnHover();
        });
        
        menuOverlay.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(hideMenuOnHover, 300);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (e.clientX <= 10) {
                clearTimeout(hoverTimeout);
                showMenuOnHover();
            } else if (e.clientX > 400 && !menuOverlay.matches(':hover')) {
                hoverTimeout = setTimeout(hideMenuOnHover, 500);
            }
        });
    }
    
    // Search functionality
    if (menuSearch) {
        const searchClearBtn = document.getElementById('search-clear-btn');
        
        menuSearch.addEventListener('input', (e) => {
            const searchValue = e.target.value;
            filterPosts(searchValue);
            
            if (searchClearBtn) {
                searchClearBtn.style.display = searchValue.length > 0 ? 'flex' : 'none';
            }
        });
        
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
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            const category = filter.dataset.category;
            filterPostsByCategory(category);
        });
    });
    
    // Post item clicks are now handled by generateBlogPostsHTML()
    // since the content is dynamically generated
    
    // Escape key to close menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

function toggleMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    if (menuOverlay.classList.contains('active')) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuToggle = document.querySelector('.blog-menu-toggle');
    const menuIndicator = document.getElementById('blog-menu-indicator');
    
    if (menuOverlay && menuBackdrop && menuToggle) {
        menuOverlay.classList.add('active');
        menuBackdrop.classList.add('active');
        menuToggle.classList.add('active');
        
        if (menuIndicator) {
            menuIndicator.style.opacity = '0';
        }
        
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
}

function closeMenu() {
    const menuOverlay = document.getElementById('blog-menu-overlay');
    const menuBackdrop = document.getElementById('blog-menu-backdrop');
    const menuToggle = document.querySelector('.blog-menu-toggle');
    const menuIndicator = document.getElementById('blog-menu-indicator');
    
    if (menuOverlay && menuBackdrop && menuToggle) {
        menuOverlay.classList.remove('active', 'hover-active');
        menuBackdrop.classList.remove('active');
        menuToggle.classList.remove('active');
        
        if (menuIndicator) {
            menuIndicator.style.opacity = '';
        }
        
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
        const category = item.dataset.category?.toLowerCase() || '';
        
        const matches = title.includes(term) || 
                       description.includes(term) || 
                       tags.includes(term) || 
                       category.includes(term);
        item.style.display = matches ? 'block' : 'none';
    });
}

function filterPostsByCategory(category) {
    const postItems = document.querySelectorAll('.menu-post-item');
    
    postItems.forEach(item => {
        const postCategory = item.dataset.category;
        // Case-insensitive comparison
        const shouldShow = category === 'all' || 
                          (postCategory && postCategory.toLowerCase() === category.toLowerCase());
        item.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Update category count display (optional)
    const visibleItems = document.querySelectorAll('.menu-post-item[style="display: block"], .menu-post-item:not([style*="display: none"])');
    console.log(`Filtered to category '${category}': showing ${visibleItems.length} posts`);
}

function setupTagClickHandlers() {
    // Find all clickable tags in the header
    const clickableTags = document.querySelectorAll('.tag.clickable-tag');
    
    clickableTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            
            const tagText = tag.dataset.tag || tag.textContent.trim();
            
            // Open the menu
            openMenu();
            
            // Set the search filter to the tag text
            const menuSearch = document.getElementById('menu-search');
            if (menuSearch) {
                menuSearch.value = tagText;
                
                // Trigger the search
                filterPosts(tagText);
                
                // Show the clear button
                const searchClearBtn = document.getElementById('search-clear-btn');
                if (searchClearBtn) {
                    searchClearBtn.style.display = 'flex';
                }
                
                // Reset category filter to "all"
                const categoryFilters = document.querySelectorAll('.category-filter');
                categoryFilters.forEach(f => f.classList.remove('active'));
                const allFilter = document.querySelector('.category-filter[data-category="all"]');
                if (allFilter) {
                    allFilter.classList.add('active');
                }
            }
            
            console.log(`Tag clicked: ${tagText}, menu opened with search filter`);
        });
    });
}

// === COPY BUTTONS FOR CODE BLOCKS ===
function addCopyButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.markdrown-content pre');
    
    codeBlocks.forEach(pre => {
        if (pre.parentElement.classList.contains('code-block-container')) return;
        
        const codeElement = pre.querySelector('code');
        const codeText = codeElement ? codeElement.textContent : pre.textContent;
        const lines = codeText.split('\n');
        
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        const container = document.createElement('div');
        container.className = 'code-block-container';
        
        const hasFilename = pre.hasAttribute('data-filename');
        if (hasFilename) {
            container.classList.add('has-filename');
        }
        
        const linedCodeBlock = document.createElement('div');
        linedCodeBlock.className = 'code-block-with-lines';
        
        if (hasFilename) {
            linedCodeBlock.classList.add('has-filename');
            linedCodeBlock.setAttribute('data-filename', pre.getAttribute('data-filename'));
        }
        
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'code-line-numbers';
        
        for (let i = 1; i <= lines.length; i++) {
            const lineNumber = document.createElement('span');
            lineNumber.className = 'line-number';
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }
        
        const newPre = pre.cloneNode(true);
        
        container.classList.add('has-lines');
        pre.parentNode.insertBefore(container, pre);
        
        linedCodeBlock.appendChild(lineNumbers);
        linedCodeBlock.appendChild(newPre);
        container.appendChild(linedCodeBlock);
        
        pre.remove();
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        copyBtn.innerHTML = `
            <i data-lucide="copy" class="copy-icon"></i>
            <span class="copy-text">Copy</span>
        `;
        
        copyBtn.addEventListener('click', async () => {
            await handleCopyButtonClick(copyBtn, newPre);
        });
        
        container.appendChild(copyBtn);
    });
}

async function handleCopyButtonClick(copyBtn, preElement) {
    try {
        const codeElement = preElement.querySelector('code');
        const codeText = codeElement ? codeElement.textContent : preElement.textContent;
        
        await copyToClipboard(codeText);
        await updateCopyButtonState(copyBtn, 'success');
        await sleep(2000);
        await updateCopyButtonState(copyBtn, 'default');
        
    } catch (err) {
        console.error('Failed to copy code:', err);
        
        try {
            const codeElement = preElement.querySelector('code');
            const codeText = codeElement ? codeElement.textContent : preElement.textContent;
            await copyToClipboardFallback(codeText);
            
            await updateCopyButtonState(copyBtn, 'success');
            await sleep(2000);
            await updateCopyButtonState(copyBtn, 'default');
            
        } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr);
            
            await updateCopyButtonState(copyBtn, 'error');
            await sleep(2000);
            await updateCopyButtonState(copyBtn, 'default');
        }
    }
}

async function copyToClipboard(text) {
    if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
    }
    return navigator.clipboard.writeText(text);
}

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
    
    if (window.lucide) lucide.createIcons();
}

// === STICKY CONTROLS BAR ===
function initStickyControlsBar() {
    const controlsBar = document.querySelector('.controls-bar');
    const header = document.querySelector('header');
    
    if (!controlsBar || !header) return;
    
    // Wait for navigation to be loaded
    const checkNavigation = () => {
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            setupStickyControls(controlsBar, header, navContainer);
        } else {
            setTimeout(checkNavigation, 100);
        }
    };
    
    checkNavigation();
}

function setupStickyControls(controlsBar, header, navContainer) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const stickyControls = navContainer.querySelector('.controls-bar');
            if (!stickyControls) return;
            
            if (entry.isIntersecting) {
                stickyControls.classList.add('hidden');
            } else {
                stickyControls.classList.remove('hidden');
            }
        });
    }, {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px'
    });
    
    observer.observe(header);
}

function setupControlsEventListeners() {
    // Main controls bar (if it exists)
    const mainTabButtons = document.querySelectorAll('main .tab-button');
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            switchTab(tabName);
        });
    });
    
    // Sticky controls bar (in navigation, if it exists)
    const stickyTabButtons = document.querySelectorAll('.nav-container .tab-button');
    stickyTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            switchTab(tabName);
        });
    });
    
    setupBasicEventListeners();
}

function setupBasicEventListeners() {
    // Menu toggles (always available)
    document.querySelectorAll('.blog-menu-toggle').forEach(btn => {
        // Check if handler already attached
        if (btn.hasAttribute('data-handler-attached')) return;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
        
        btn.setAttribute('data-handler-attached', 'true');
    });
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Always initialize basic functionality
    initializeProfileImageSwitching();
    
    // Load navigation (which will trigger blog functionality initialization)
    loadNavigation();

    setupTagClickHandlers();
    
    // Initialize icons
    if (window.lucide) lucide.createIcons();
    
    // Fallback: if navigation doesn't load, still try to initialize blog functionality
    setTimeout(() => {
        if (!document.querySelector('.nav-container')) {
            initializeBlogFunctionality();
        }
    }, 1000);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
            document.body.style.overflow = '';
        }
    });
});