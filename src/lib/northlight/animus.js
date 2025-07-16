/**
 * Animus.js - Optimized Animation Library
 * Only observes elements that actually need scroll detection
 */
(function() {
    'use strict';

    let scrollObserver = null;
    const config = {
        threshold: 0.1,
        rootMargin: '0px',
        staggerDelay: 50
    };

    /**
     * Initialize scroll observer for elements that need it
     */
    function createScrollObserver() {
        scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateElement(entry.target);
                } else if (entry.target.hasAttribute('data-animus-repeat')) {
                    resetElement(entry.target);
                }
            });
        }, {
            threshold: config.threshold,
            rootMargin: config.rootMargin
        });
    }

    /**
     * Animate element
     */
    function animateElement(element, animation) {
        // Skip if already animated and not repeating
        if (element.classList.contains('animus-animated') && 
            !element.hasAttribute('data-animus-repeat')) {
            return;
        }

        animation = animation || element.getAttribute('data-animus');
        const delay = parseInt(element.getAttribute('data-animus-delay') || '0');

        if (animation === 'stagger') {
            animateStagger(element);
        } else {
            setTimeout(() => {
                element.classList.add(`animus-${animation}`, 'animus-animated');
            }, delay);
        }
    }

    /**
     * Animate stagger children
     */
    function animateStagger(container) {
        const children = container.children;
        const childAnimation = container.getAttribute('data-animus-children') || 'fade-in-up';
        const baseDelay = parseInt(container.getAttribute('data-animus-delay') || '0');
        
        Array.from(children).forEach((child, index) => {
            setTimeout(() => {
                child.classList.add(`animus-${childAnimation}`, 'animus-animated');
                child.style.opacity = '1'; // Ensure visibility
            }, baseDelay + (index * config.staggerDelay));
        });
        
        container.classList.add('animus-animated');
    }

    /**
     * Reset element for re-animation
     */
    function resetElement(element) {
        const animationClasses = Array.from(element.classList)
            .filter(c => c.startsWith('animus-') && c !== 'animus-animated');
        
        animationClasses.forEach(c => element.classList.remove(c));
        element.classList.remove('animus-animated');
        
        if (element.getAttribute('data-animus') === 'stagger') {
            Array.from(element.children).forEach(child => {
                const childClasses = Array.from(child.classList)
                    .filter(c => c.startsWith('animus-'));
                childClasses.forEach(c => child.classList.remove(c));
                child.style.opacity = '0';
            });
        }
    }

    /**
     * Process new elements
     */
    function processElement(element) {
        const trigger = element.getAttribute('data-animus-trigger');
        
        if (trigger === 'scroll') {
            // Only observe scroll-triggered elements
            scrollObserver.observe(element);
        } else if (trigger === 'hover') {
            // Hover animations are CSS-only, no JS needed
            return;
        } else if (!trigger || trigger === 'load') {
            // Immediate animation on load
            animateElement(element);
        }
    }

    /**
     * Initialize library
     */
    function init() {
        // Create scroll observer
        createScrollObserver();
        
        // Process all animation elements
        const elements = document.querySelectorAll('[data-animus]');
        elements.forEach(processElement);
        
        // Watch for new elements
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.hasAttribute('data-animus')) {
                            processElement(node);
                        }
                        // Check children
                        const children = node.querySelectorAll ? 
                            node.querySelectorAll('[data-animus]') : [];
                        children.forEach(processElement);
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Public API
    window.Animus = {
        init: init,
        
        // Manual animation trigger
        animate(element, animation) {
            if (!element) return;
            
            // Reset if needed
            if (element.classList.contains('animus-animated')) {
                resetElement(element);
                // Small delay for reset to take effect
                setTimeout(() => animateElement(element, animation), 10);
            } else {
                animateElement(element, animation);
            }
        },
        
        // Update configuration
        config(options) {
            Object.assign(config, options);
            if (scrollObserver) {
                scrollObserver.disconnect();
                createScrollObserver();
                this.refresh();
            }
        },
        
        // Refresh observations
        refresh() {
            const scrollElements = document.querySelectorAll('[data-animus-trigger="scroll"]');
            scrollElements.forEach(element => scrollObserver.observe(element));
        },
        
        // Add animation to element
        add(element, animation, options = {}) {
            if (!element) return;
            
            element.setAttribute('data-animus', animation);
            if (options.trigger) element.setAttribute('data-animus-trigger', options.trigger);
            if (options.delay) element.setAttribute('data-animus-delay', options.delay);
            if (options.repeat) element.setAttribute('data-animus-repeat', '');
            
            processElement(element);
        },
        
        // Debug info
        debug() {
            const scrollElements = document.querySelectorAll('[data-animus-trigger="scroll"]');
            const immediateElements = document.querySelectorAll('[data-animus]:not([data-animus-trigger])');
            console.log(`Animus Debug:
- Scroll-observed elements: ${scrollElements.length}
- Immediate elements: ${immediateElements.length}
- Total animations: ${scrollElements.length + immediateElements.length}`);
        }
    };

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();