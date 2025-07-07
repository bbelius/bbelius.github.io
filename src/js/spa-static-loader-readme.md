Animated content swaps from static HTML files

Scripts in loaded content are run automatically (including external and inline)

After each swap you can run any re-initialization code you need, via afterSwap

This is production-ready for static HTML websites needing SPA-style navigation and dynamic JS.

import SpaStaticLoader from './spa-static-loader.js';

new SpaStaticLoader({
    selector: '#main-content',
    animDuration: 750,
    onNavigate: ({url, navigationFlag}) => {
        // For analytics, logs, etc.
        console.log('Navigated to', url, 'SPA?', navigationFlag);
    },
    afterSwap: () => {
        // Re-initialize JS (icons, tooltips, event handlers, etc.)
        if (window.feather) feather.replace();
        // or
        // myCustomInit();
    }
});
