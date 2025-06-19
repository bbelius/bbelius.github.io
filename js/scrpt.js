function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x+x).join('');
    let num = parseInt(hex, 16);
    return [num >> 16 & 255, num >> 8 & 255, num & 255];
}
function rgbToHex([r, g, b]) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function lerpColor(rgb1, rgb2, t) {
    return [
        Math.round(lerp(rgb1[0], rgb2[0], t)),
        Math.round(lerp(rgb1[1], rgb2[1], t)),
        Math.round(lerp(rgb1[2], rgb2[2], t))
    ];
}

const colorStops = [
/* Night & Pre-dawn */
  "#3F51B5", /* 00:00 Midnight Indigo */
  "#5c6cc0", /* 02:00 Deep Night Blue */

  /* Sunrise */
  "#b98a54", /* 04:00 Vivid Amber */
  "#FFD600", /* 06:00 Bright Gold */

  /* Morning */
  "#9CCC65", /* 08:00 Fresh Spring Green */
  "#29B6F6", /* 10:00 Sky Cyan */

  /* Midday */
  "#4FC3F7", /* 12:00 Electric Blue */
  "#2196F3", /* 14:00 Bold Blue */
  "#1E88E5", /* 16:00 Azure Boost */

  /* Early Evening */
  "#1976D2", /* 18:00 Cerulean Deep */
  "#FF5722", /* 20:00 Vibrant Sunset Coral */

  /* Late Evening */
  "#9575CD"  /* 22:00 Vivid Violet Indigo */
].map(hexToRgb);

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
    const seg = 24 / colorStops.length;
    let idx = Math.floor(hours / seg);
    let nextIdx = (idx + 1) % colorStops.length;
    let t = (hours % seg) / seg;
    const col = lerpColor(colorStops[idx], colorStops[nextIdx], t);
    const colHex = rgbToHex(col);
    document.documentElement.style.setProperty('--primary-color', colHex);
    document.documentElement.style.setProperty('--primary-rgb', `${col[0]}, ${col[1]}, ${col[2]}`);
}

// Update color immediately on load
updatePrimaryColor();

// Then update every 5 minutes (300000ms)
setInterval(updatePrimaryColor, 300000);

// Global function to initialize profile image switching
function initializeProfileImageSwitching() {
    const profileImg = document.querySelector('.profile-pic-highlight img');
    const profileContainer = document.querySelector('.profile-pic-highlight');
    
    if (profileImg && profileContainer) {
        // Remove any existing event listeners by cloning the element
        const newProfileContainer = profileContainer.cloneNode(true);
        profileContainer.parentNode.replaceChild(newProfileContainer, profileContainer);
        
        // Get references to the new elements
        const newProfileImg = newProfileContainer.querySelector('img');
        
        // Store the original image source
        const originalSrc = newProfileImg.src;
        const alternateSrc = '/img/profile.jpg';
        let isOriginal = true;
        
        // Add click event listener to the entire container
        newProfileContainer.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent multiple clicks during animation
            if (this.style.pointerEvents === 'none') return;
            this.style.pointerEvents = 'none';
            
            // Add flip animation to the entire container
            this.style.transform = 'rotateY(90deg)';
            
            setTimeout(() => {
                if (isOriginal) {
                    newProfileImg.src = alternateSrc;
                    isOriginal = false;
                } else {
                    newProfileImg.src = originalSrc;
                    isOriginal = true;
                }
                
                // Complete the flip animation
                setTimeout(() => {
                    this.style.transform = 'rotateY(0deg)';
                    // Re-enable clicks after animation completes
                    setTimeout(() => {
                        this.style.pointerEvents = 'auto';
                    }, 300);
                }, 50);
            }, 150);
        });
        
        // Add cursor pointer to indicate it's clickable
        newProfileContainer.style.cursor = 'pointer';
    }
}

// Global function to initialize skill expansion functionality
function initializeSkillExpansion() {
    const skillItems = document.querySelectorAll('.skills li[data-skill]');
    const skillDescriptions = document.querySelectorAll('.skill-description');
    const skillDescriptionsContainer = document.querySelector('.skill-descriptions');
    let currentlyActive = null;

    skillItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const skillId = this.getAttribute('data-skill');
            const targetDescription = document.querySelector(`.skill-description[data-skill="${skillId}"]`);
            
            // If clicking on the currently active item, collapse it
            if (currentlyActive === this) {
                this.classList.remove('active');
                
                // Fade out current description
                const currentDescription = document.querySelector('.skill-description.active');
                if (currentDescription) {
                    currentDescription.style.opacity = '0';
                    currentDescription.style.transform = 'translateY(10px)';
                }
                
                // Collapse and hide container
                skillDescriptionsContainer.style.height = '0px';
                skillDescriptionsContainer.classList.remove('active');
                
                setTimeout(() => {
                    skillDescriptions.forEach(desc => {
                        desc.classList.remove('active');
                        desc.style.display = 'none';
                    });
                }, 400);
                
                currentlyActive = null;
                return;
            }
            
            // Remove active state from all items
            skillItems.forEach(skill => skill.classList.remove('active'));
            
            // Activate the clicked item
            this.classList.add('active');
            
            // Measure target height
            targetDescription.style.display = 'block';
            targetDescription.style.opacity = '0';
            targetDescription.style.transform = 'translateY(10px)';
            const targetHeight = targetDescription.offsetHeight;
            targetDescription.style.display = 'none';
            
            const currentDescription = document.querySelector('.skill-description.active');
            
            if (currentDescription) {
                // Cross-fade: fade out current, resize container, fade in new
                currentDescription.style.opacity = '0';
                currentDescription.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    currentDescription.classList.remove('active');
                    currentDescription.style.display = 'none';
                    
                    // Set new height and show new content
                    skillDescriptionsContainer.style.height = targetHeight + 'px';
                    targetDescription.style.display = 'block';
                    targetDescription.classList.add('active');
                    
                    // Fade in new content
                    setTimeout(() => {
                        targetDescription.style.opacity = '1';
                        targetDescription.style.transform = 'translateY(0)';
                    }, 50);
                }, 200);
            } else {
                // No current description, show container and expand
                skillDescriptionsContainer.classList.add('active');
                skillDescriptionsContainer.style.height = targetHeight + 'px';
                
                setTimeout(() => {
                    targetDescription.style.display = 'block';
                    targetDescription.classList.add('active');
                    
                    setTimeout(() => {
                        targetDescription.style.opacity = '1';
                        targetDescription.style.transform = 'translateY(0)';
                    }, 50);
                }, 100);
            }
            
            currentlyActive = this;
        });
    });
}

// Global function to initialize tools page functionality
function initializeToolsPage() {
    const toolNodes = document.querySelectorAll('.tool-node');
    const workflowSteps = document.querySelectorAll('.workflow-step');
    const insightCards = document.querySelectorAll('.insight-card');
    const detailsPanel = document.getElementById('toolDetailsPanel');
    const toolContents = document.querySelectorAll('.tool-content');
    
    // Initialize tool nodes
    toolNodes.forEach((node, index) => {
        
        // Add click interaction
        node.addEventListener('click', function() {
            const toolId = this.getAttribute('data-tool');
            
            // Hide all tool content sections
            toolContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show the selected tool content or default
            const targetContent = document.querySelector(`.tool-content[data-tool="${toolId}"]`) ||
                                 document.querySelector('.tool-content[data-tool="default"]');
            
            if (targetContent) {
                targetContent.style.display = 'block';
                
                // Highlight selected node
                toolNodes.forEach(n => n.classList.remove('selected'));
                this.classList.add('selected');
                
                // Animate panel update
                detailsPanel.style.transform = 'translateY(10px)';
                detailsPanel.style.opacity = '0.7';
                setTimeout(() => {
                    detailsPanel.style.transform = 'translateY(0)';
                    detailsPanel.style.opacity = '1';
                }, 150);
            }
        });
        
    });
    
    // Animate workflow steps on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
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
    
    // Animate insight cards
    insightCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
}

// Global function to initialize all page functionality
function initializePageFunctionality() {
    initializeProfileImageSwitching();
    initializeSkillExpansion();
    
    // Check if we're on the tools page and initialize tools-specific functionality
    if (document.body.getAttribute('data-page') === 'tools') {
        initializeToolsPage();
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePageFunctionality();
});

// Make the function globally available for SPA navigation
window.initializePageFunctionality = initializePageFunctionality;