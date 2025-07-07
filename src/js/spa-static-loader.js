// spa-static-loader.js
export default class SpaStaticLoader {
    /**
     * @param {Object} options
     * @param {string} options.selector - CSS selector for content area
     * @param {function} [options.onNavigate] - callback after navigation
     * @param {function} [options.afterSwap] - called after content swap & script execution
     * @param {number} [options.animDuration] - animation duration in ms
     */
    constructor({selector, onNavigate, afterSwap, animDuration=750}) {
        this.selector = selector;
        this.onNavigate = onNavigate || (()=>{});
        this.afterSwap = afterSwap || (()=>{});
        this.animDuration = animDuration;
        this.navigationFlag = false;

        document.addEventListener('click', this._onClick.bind(this));
        window.addEventListener('popstate', this._onPopState.bind(this));
        window.addEventListener('hashchange', this._onHashChange.bind(this));
        this._monkeyPatchHistory();

        // Initial content load
        this.navigate(location.pathname + location.search + location.hash, true);
    }

    _onClick(e) {
        const a = e.target.closest('a');
        if (!a || a.target === "_blank" || a.hasAttribute('download') || a.getAttribute('rel') === "external") return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
        e.preventDefault();
        this.navigate(href);
    }

    _onPopState() {
        this.navigate(location.pathname + location.search + location.hash, true);
    }

    _onHashChange() {
        // Only update the hash, do not reload the whole content
        this._scrollToHash(location.hash);
        this.onNavigate({url: location.href, navigationFlag: false});
        this.afterSwap();
    }

    _monkeyPatchHistory() {
        const origPush = history.pushState;
        const origReplace = history.replaceState;
        history.pushState = (...args) => { origPush.apply(history, args); this.navigate(location.pathname + location.search + location.hash, true); };
        history.replaceState = (...args) => { origReplace.apply(history, args); this.navigate(location.pathname + location.search + location.hash, true); };
    }

    async navigate(url, isPop=false) {
        this.navigationFlag = true;
        const urlObj = new URL(url, location.origin);

        // Do not reload for hash-only change
        if (urlObj.pathname === location.pathname && urlObj.search === location.search && urlObj.hash !== location.hash) {
            this._scrollToHash(urlObj.hash);
            this.onNavigate({url, navigationFlag: false});
            this.afterSwap();
            return;
        }

        // Manage history unless triggered by popstate/replace/push
        if (!isPop) history.pushState({}, '', url);

        // Compute the target static file, e.g. "/about" => "/about.html"
        let targetPath = urlObj.pathname;
        if (targetPath.endsWith('/')) targetPath += 'index.html';
        else if (!targetPath.match(/\.\w+$/)) targetPath += '.html';

        try {
            const resp = await fetch(targetPath, {headers: {'X-Requested-With': 'spa-static-loader'}});
            if (!resp.ok) throw new Error('Not found');
            const html = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector(this.selector);
            if (!newContent) throw new Error('Selector not found in target page');

            // Animate content area out & in, then execute scripts
            const contentEl = document.querySelector(this.selector);
            await this._animateSwap(contentEl, newContent.innerHTML);
            this._executeInlineScripts(contentEl);

            // Scroll to hash if present
            this._scrollToHash(urlObj.hash);

            this.onNavigate({url, navigationFlag: this.navigationFlag});
            this.afterSwap();
        } catch (e) {
            const contentEl = document.querySelector(this.selector);
            await this._animateSwap(contentEl, `<h2>404 - Page not found</h2>`);
            this.onNavigate({url, navigationFlag: this.navigationFlag});
            this.afterSwap();
        }
        this.navigationFlag = false;
    }

    _animateSwap(el, newInner) {
        return new Promise(res => {
            el.style.transition = `opacity ${this.animDuration/2}ms`;
            el.style.opacity = 0;
            setTimeout(() => {
                el.innerHTML = newInner;
                el.style.transition = `opacity ${this.animDuration/2}ms`;
                el.style.opacity = 1;
                setTimeout(res, this.animDuration/2);
            }, this.animDuration/2);
        });
    }

    _scrollToHash(hash) {
        if (hash && hash.length > 1) {
            const el = document.getElementById(hash.substring(1));
            if (el) el.scrollIntoView({behavior: "smooth"});
        }
    }

    _executeInlineScripts(el) {
        el.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            // Copy all attributes
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });
    }
}
