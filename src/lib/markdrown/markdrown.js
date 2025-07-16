export class Markdrown {
    constructor() {
        // List of all registered plugins: {type: 'block'|'inline', priority: number, parse: fn}
        this.plugins = [];
        // Array to store post-render callback functions
        this.postRenderCallbacks = [];
        // Register core plugins with default priorities
        this.registerCorePlugins();
    }

    metaHeader = {};

    // Core plugin registration
    registerCorePlugins() {
        // YAML metadata header extension for Markdrown
        this.addPlugin({
            type: 'block',
            priority: 0, // Must run before all others
            parse: (lines, i, _inline) => {
                if (i === 0 && /^---\s*$/.test(lines[i])) {
                    let j = i + 1;
                    let headerLines = [];
                    while (j < lines.length && !/^---\s*$/.test(lines[j])) {
                        headerLines.push(lines[j]);
                        j++;
                    }
                    if (lines[j] && /^---\s*$/.test(lines[j])) {
                        // Parse YAML
                        headerLines.forEach(line => {
                            const m = line.match(/^([^:#]+):\s*(.*)$/);
                            if (m) this.metaHeader[m[1].trim()] = m[2].trim();
                        });
                        // Remove header from output
                        return { html: '', linesUsed: (j - i + 1) };
                    }
                }
            }
        });
    }

    // Plugin registration
    addPlugin(plugin) {
        this.plugins.push(plugin);
        this.plugins.sort((a, b) => a.priority - b.priority);
        
        // If plugin has a postRender function, call it to let the plugin register callbacks
        if (typeof plugin.postRender === 'function') {
            plugin.postRender(this.registerPostRenderCallback.bind(this));
        }
    }

    /**
     * Register a post-render callback function
     * This is called by plugins during their postRender phase
     * @param {Function} callback - Function to execute after HTML is rendered
     */
    registerPostRenderCallback(callback) {
        if (typeof callback === 'function') {
            this.postRenderCallbacks.push(callback);
        }
    }

    /**
     * Execute all registered post-render callbacks
     * This should be called by the client after inserting the rendered HTML into the DOM
     * @param {HTMLElement} container - The DOM element containing the rendered markdown (optional)
     * @param {Object} context - Additional context to pass to callbacks (optional)
     */
    executePostRenderCallbacks(container = null, context = {}) {
        this.postRenderCallbacks.forEach(callback => {
            try {
                console.log('Executing post-render callback:', callback);
                callback(container, context);
            } catch (error) {
                console.warn('Post-render callback failed:', error);
            }
        });
    }

    /**
     * Clear all registered post-render callbacks
     * Useful when creating a new parsing session
     */
    clearPostRenderCallbacks() {
        this.postRenderCallbacks = [];
    }

    /**
     * Wraps content between h3 elements into section divs
     * @param {string} html - The rendered HTML
     * @returns {string} - HTML with sections wrapped
     */
    wrapSections(html) {
        // Create a temporary DOM to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const children = Array.from(tempDiv.children);
        const result = document.createElement('div');
        
        let currentSection = null;
        let currentSectionContent = [];
        
        for (let i = 0; i < children.length; i++) {
            const element = children[i];
            
            if (element.tagName === 'H3') {
                // If we have a current section, wrap it and add to result
                if (currentSection) {
                    const sectionDiv = document.createElement('div');
                    sectionDiv.className = 'section';
                    sectionDiv.appendChild(currentSection);
                    currentSectionContent.forEach(content => sectionDiv.appendChild(content));
                    result.appendChild(sectionDiv);
                }
                
                // Start new section
                currentSection = element.cloneNode(true);
                currentSectionContent = [];
            } else if (currentSection) {
                // Add content to current section
                currentSectionContent.push(element.cloneNode(true));
            } else {
                // No current section, add directly to result
                result.appendChild(element.cloneNode(true));
            }
        }
        
        // Handle the last section if it exists
        if (currentSection) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';
            sectionDiv.appendChild(currentSection);
            currentSectionContent.forEach(content => sectionDiv.appendChild(content));
            result.appendChild(sectionDiv);
        }
        
        return result.innerHTML;
    }

    /**
     * Alternative string-based section wrapping (doesn't require DOM)
     * @param {string} html - The rendered HTML
     * @returns {string} - HTML with sections wrapped
     */
    wrapSectionsString(html) {
        const result = [];
        const lines = html.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Check if this line starts a div with class="section"
            if (line.includes('<div') && (line.includes('class="section') || line.includes('class="section '))) {
                // This is an already-wrapped section, find its end and add it as-is
                let divDepth = 0;
                let sectionLines = [];
                
                while (i < lines.length) {
                    const currentLine = lines[i];
                    sectionLines.push(currentLine);
                    
                    // Count div opens and closes
                    const opens = (currentLine.match(/<div[^>]*>/g) || []).length;
                    const closes = (currentLine.match(/<\/div>/g) || []).length;
                    divDepth += opens - closes;
                    
                    i++;
                    
                    // When divDepth reaches 0, we've closed the section
                    if (divDepth === 0) {
                        break;
                    }
                }
                
                // Add the entire existing section as-is
                result.push(...sectionLines);
            }
            // Check if this line contains an h3 tag
            else if (line.includes('<h3')) {
                // Start collecting content for a new section
                let sectionContent = [lines[i]]; // Start with the h3 line
                i++;
                
                // Collect content until we hit another h3 or a div.section or end of content
                while (i < lines.length) {
                    const nextLine = lines[i].trim();
                    
                    // Stop if we hit another h3
                    if (nextLine.includes('<h3')) {
                        break;
                    }
                    
                    // Stop if we hit a div with class="section"
                    if (nextLine.includes('<div') && (nextLine.includes('class="section') || nextLine.includes('class="section '))) {
                        break;
                    }
                    
                    sectionContent.push(lines[i]);
                    i++;
                }
                
                // Wrap this content in a section div
                result.push('<div class="section">');
                result.push(...sectionContent);
                result.push('</div>');
                
                // Don't increment i here since we'll process the next line in the main loop
                continue;
            }
            else {
                // Regular content that's not part of a section, add as-is
                result.push(lines[i]);
                i++;
            }
        }
        
        return result.join('\n');
    }

    // Main parsing entry point
    parse(md, wrapSections = true) {
        const lines = md.replace(/\r\n?/g, '\n').split('\n');
        const out = [];
        let i = 0;

        const blockPlugins = this.plugins
            .filter(p => p.type === 'block')
            .slice()
            .sort((a, b) => a.priority - b.priority);

        const inlinePlugins = this.plugins
            .filter(p => p.type === 'inline')
            .slice()
            .sort((a, b) => a.priority - b.priority);

        // Inline parse with priority, used inside block rules
        const inlineParse = (inputLines) => {
            let html = inputLines.join(' ');
            for (let plugin of inlinePlugins) {
                html = plugin.parse(html);
            }
            return html;
        };

        let buffer = [];

        while (i < lines.length) {
            let handled = false;

            // Ignore blank lines in buffer (flush later)
            if (lines[i].trim() === '') {
                if (buffer.length) {
                    out.push(`<p>${inlineParse([buffer.join(' ')])}</p>`);
                    buffer = [];
                }
                i++;
                continue;
            }

            for (let plugin of blockPlugins) {
                let result = plugin.parse(lines, i, inlineParse);
                if (result && result.html != null) {
                    if (buffer.length) {
                        out.push(`<p>${inlineParse([buffer.join(' ')])}</p>`);
                        buffer = [];
                    }
                    out.push(result.html);
                    i += result.linesUsed;
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                // Buffer unhandled line
                buffer.push(lines[i]);
                i++;
            }
        }
        // Flush any trailing buffer
        if (buffer.length) {
            out.push(`<p>${inlineParse([buffer.join(' ')])}</p>`);
        }
        
        let html = out.join('\n').replace(/\n{3,}/g, '\n\n');
        
        // Apply section wrapping if requested
        if (wrapSections) {
            html = this.wrapSectionsString(html);
        }
        
        return html;
    }

    // Util for plugin devs
    static escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    AddAllPlugins() {
        this.addPlugin(linkPlugin());
        this.addPlugin(taskListPlugin());
        this.addPlugin(tablePlugin());
        this.addPlugin(imagePlugin());
        this.addPlugin(headingPlugin());
        this.addPlugin(nestedListPlugin());
        this.addPlugin(codeblockPlugin());
        this.addPlugin(strongEmUnderlinePlugin());
        this.addPlugin(lucideIconPlugin());
        this.addPlugin(inlineCodePlugin());
        this.addPlugin(blockquoteWithTitlePlugin(this));
        this.addPlugin(cssGridPlugin(this));
        this.addPlugin(hrPlugin());
        this.addPlugin(strikethroughPlugin());
        this.addPlugin(linebreakPlugin());
        this.addPlugin(htmlPassthroughPlugin());
        this.addPlugin(anchorLinkPlugin());
    }
}

// Heading (priority 10)
function headingPlugin() {
    return {
        type: 'block',
        priority: 10,
        parse: (lines, i, next) => {
            const line = lines[i];
            // Match heading, optional ID, and the rest as title
            // Ex: ## #myId My Heading
            const m = line.match(/^(#{1,6})\s+(#([A-Za-z][\w\-]*))?\s*(.*)$/);
            if (m) {
                const level = m[1].length;
                const id = m[3]; // (group 3 is the ID if present)
                const title = m[4] || m[2]; // fallback if no ID
                let html = `<h${level}`;
                if (id) html += ` id="${id}"`;
                html += `>${next([title.trim()])}</h${level}>`;
                return {
                    html,
                    linesUsed: 1
                };
            }
        }
    };
}

// Code block
function codeblockPlugin() {
    return {
        type: 'block',
        priority: 20,
        parse: (lines, i, _next) => {
            const line = lines[i];
            if (!line.startsWith("```")) return;

            // Parse: ```lang [filename]
            const m = line.match(/^```([^\s]*)\s*(.+)?$/);
            const lang = m && m[1] ? m[1].trim() : '';
            const filename = m && m[2] ? m[2].trim() : '';

            let code = [];
            let j = i + 1;
            while (j < lines.length && !lines[j].startsWith("```")) {
                code.push(lines[j]);
                j++;
            }

            // Prepare attributes
            const dataLang = lang ? ` data-lang="${Markdrown.escapeHTML(lang)}"` : '';
            const dataFilename = filename ? ` data-filename="${Markdrown.escapeHTML(filename)}"` : '';
            const codeClass = lang ? `language-${Markdrown.escapeHTML(lang)}` : '';

            let html = `<pre${dataLang}${dataFilename}><code${dataLang}${dataFilename}${codeClass ? ` class="${codeClass}"` : ''}>${Markdrown.escapeHTML(code.join('\n'))}</code></pre>`;

            return {
                html,
                linesUsed: (j - i) + 1
            };
        }
    };
}

// Inline code
function inlineCodePlugin() {
    return {
        type: 'inline',
        priority: 30,
        parse: text => text.replace(/`([^`]+?)`/g, (m, a) =>
            `<code>${Markdrown.escapeHTML(a)}</code>`
        )
    };
}

// Link [text](url)
function linkPlugin() {
    return {
        type: 'inline',
        priority: 40,
        parse: text => text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) =>
            `<a href="${Markdrown.escapeHTML(url)}">${Markdrown.escapeHTML(text)}</a>`
        )
    };
}

// TABLE plugin
function tablePlugin() {
    return {
        type: 'block',
        priority: 50,
        parse: (lines, i, inline) => {
            // Check if it's a table header row followed by a --- separator
            if (!/\|/.test(lines[i])) return;
            if (!lines[i + 1] || !/^ *\|? *[:-]+[-| :]*\|? *$/.test(lines[i + 1])) return;
            let tableRows = [lines[i], lines[i + 1]];
            let j = i + 2;
            while (j < lines.length && /\|/.test(lines[j])) {
                tableRows.push(lines[j]);
                j++;
            }
            // Parse rows
            let header = tableRows[0].split('|').map(s => s.trim());
            let aligns = tableRows[1].split('|').map(s =>
                /:-+:/.test(s) ? 'center' : /:-+/.test(s) ? 'left' : /-+:/.test(s) ? 'right' : ''
            );
            let html = '<table><thead><tr>';
            for (let k = 0; k < header.length; k++) {
                html += `<th${aligns[k] ? ` style="text-align:${aligns[k]}"` : ''}>${inline([header[k]])}</th>`;
            }
            html += '</tr></thead><tbody>';
            for (let r = 2; r < tableRows.length; r++) {
                let cells = tableRows[r].split('|').map(s => s.trim());
                html += '<tr>' + cells.map((cell, k) =>
                    `<td${aligns[k] ? ` style="text-align:${aligns[k]}"` : ''}>${inline([cell])}</td>`
                ).join('') + '</tr>';
            }
            html += '</tbody></table>';
            return { html, linesUsed: tableRows.length };
        }
    };
}

// IMAGE plugin
function imagePlugin() {
    return {
        type: 'inline',
        priority: 5, // Before links!
        parse: text => {
            // 1. Linked image: [![alt](src)](link)
            text = text.replace(
                /\[!\[([^\]]*)\]\(([^)]+)\)(?:\[(.*?)\])?\]\(([^)]+)\)/g,
                (m, alt, src, desc, link) => {
                    let imgHtml = desc
                        ? `<figure><img src="${Markdrown.escapeHTML(src)}" alt="${Markdrown.escapeHTML(alt)}"><figcaption>${Markdrown.escapeHTML(desc)}</figcaption></figure>`
                        : `<figure><img src="${Markdrown.escapeHTML(src)}" alt="${Markdrown.escapeHTML(alt)}"></figure>`;
                    return `<a href="${Markdrown.escapeHTML(link)}">${imgHtml}</a>`;
                }
            );

            // 2. Standalone image: ![alt](src)[desc]
            text = text.replace(
                /!\[([^\]]*)\]\(([^)]+)\)(?:\[(.*?)\])?/g,
                (m, alt, src, desc) => {
                    if (desc) {
                        return `<figure><img src="${Markdrown.escapeHTML(src)}" alt="${Markdrown.escapeHTML(alt)}"><figcaption>${Markdrown.escapeHTML(desc)}</figcaption></figure>`;
                    } else {
                        return `<figure><img src="${Markdrown.escapeHTML(src)}" alt="${Markdrown.escapeHTML(alt)}"></figure>`;
                    }
                }
            );
            return text;
        }
    };
}

function nestedListPlugin() {
    // Recognizes bullet/number/alpha lists and their indentation
    const listRegex = /^(\s*)([*+-]|\d+\.|[a-zA-Z]\.)(\s+)(.+)$/;

    function parseList(lines, start, inline, baseIndent = 0) {
        let items = [];
        let typeStack = [];
        let i = start;

        // Helper to determine list type from marker
        function getType(marker) {
            if (/^[*+-]$/.test(marker)) return 'ul';
            if (/^\d+\.$/.test(marker)) return 'ol';
            if (/^[a-zA-Z]\.$/.test(marker)) return 'ol'; // alpha lists rendered as <ol type="a|A">
            return 'ul';
        }
        function getOlType(marker) {
            if (/^[a-z]\.$/.test(marker)) return 'a';
            if (/^[A-Z]\.$/.test(marker)) return 'A';
            return null;
        }

        while (i < lines.length) {
            const m = lines[i].match(listRegex);
            if (!m) break;
            const [, indentStr, marker, , content] = m;
            const indent = indentStr.replace(/\t/g, '  ').length;
            if (indent < baseIndent) break;

            // Parse nested list
            let subList = [];
            let j = i + 1;
            while (j < lines.length) {
                const sub = lines[j].match(listRegex);
                if (!sub) break;
                const subIndent = sub[1].replace(/\t/g, '  ').length;
                if (subIndent <= indent) break;
                subList.push(lines[j]);
                j++;
            }

            // Render <li> with recursive sublist
            let html = `<li>${inline([content])}`;
            if (subList.length) {
                html += parseList(subList, 0, inline, indent + 2).html;
            }
            html += '</li>';
            items.push({
                type: getType(marker),
                olType: getOlType(marker),
                html
            });
            i = j;
        }

        // Group by type in order (don't merge ol/ul at same indent)
        let html = '';
        let currType = null;
        let currOlType = null;
        let currItems = [];
        for (const item of items) {
            if (item.type !== currType || item.olType !== currOlType) {
                if (currItems.length) {
                    if (currType === 'ol' && currOlType)
                        html += `<ol type="${currOlType}">${currItems.join('')}</ol>`;
                    else
                        html += `<${currType}>${currItems.join('')}</${currType}>`;
                }
                currType = item.type;
                currOlType = item.olType;
                currItems = [];
            }
            currItems.push(item.html);
        }
        if (currItems.length) {
            if (currType === 'ol' && currOlType)
                html += `<ol type="${currOlType}">${currItems.join('')}</ol>`;
            else
                html += `<${currType}>${currItems.join('')}</${currType}>`;
        }
        return { html, linesUsed: i - start };
    }

    return {
        type: 'block',
        priority: 30,
        parse: (lines, i, inline) => {
            if (!listRegex.test(lines[i])) return;
            return parseList(lines, i, inline, 0);
        }
    };
}

// Task Lists Plugin
function taskListPlugin() {
    // Supports [ ] [x] [-], with or without spaces inside
    const taskLine = /^(\s*)(?:[*+-]|\d+\.)?\s*\[\s*([ xX-]?)\s*\]\s+(.+)$/;

    function parseTasks(lines, i, inline, baseIndent = 0) {
        let items = [];
        let j = i;
        while (j < lines.length) {
            const m = lines[j].match(taskLine);
            if (!m) break;
            const indent = m[1].replace(/\t/g, '    ').length;
            if (indent < baseIndent) break;

            // Check for nested sub-tasks (indented > current line)
            let subStart = j + 1;
            let subItems = [];
            while (subStart < lines.length) {
                const subM = lines[subStart].match(taskLine);
                if (!subM) break;
                const subIndent = subM[1].replace(/\t/g, '    ').length;
                if (subIndent > indent) {
                    // Subtask: parse all at this deeper indent as children
                    const subTree = parseTasks(lines, subStart, inline, subIndent);
                    subItems.push(subTree.html);
                    subStart += subTree.linesUsed;
                } else if (subIndent === indent) {
                    // Same-level item, handled in main loop
                    break;
                } else {
                    // Outdent, end this group
                    break;
                }
            }

            // Class for state
            let box = m[2].toLowerCase();
            let stateClass =
                box === 'x' ? 'task-checkbox task-checked'
                    : box === '-' ? 'task-checkbox task-partial'
                        : 'task-checkbox task-unchecked';

            let html = `<li class="task-item"><span class="${stateClass}"></span>${inline([m[3]])}${subItems.join('')}</li>`;
            items.push(html);

            j = subStart;
        }

        return { html: `<ul class="task-list">${items.join('')}</ul>`, linesUsed: j - i };
    }

    return {
        type: 'block',
        priority: 5,
        parse: (lines, i, inline) => {
            if (!taskLine.test(lines[i])) return;
            return parseTasks(lines, i, inline, 0);
        }
    };
}

function blockquoteWithTitlePlugin(parserInstance) {
    // > !cssClass Title
    // > quote text
    const quoteLine = /^\s*>\s?(.*)$/;

    return {
        type: 'block',
        priority: 15, // After headings/code, before lists
        parse: (lines, i, _inline) => {
            if (!quoteLine.test(lines[i])) return;

            // Gather contiguous quote lines
            let j = i;
            let bodyLines = [];
            let header = null;
            let cssClass = '';
            while (j < lines.length && quoteLine.test(lines[j])) {
                const content = lines[j].replace(quoteLine, '$1');
                if (header === null && /^!/.test(content)) {
                    // Header line: > !class Title (class and title optional)
                    // Split on first space after !
                    const headerMatch = content.match(/^!([^\s]*)\s*(.*)$/);
                    if (headerMatch) {
                        cssClass = headerMatch[1] || '';
                        header = headerMatch[2] || '';
                    }
                } else {
                    bodyLines.push(content);
                }
                j++;
            }

            // Compose HTML
            let html = '<blockquote';
            if (cssClass) html += ` class="${Markdrown.escapeHTML(cssClass)}"`;
            html += '>';
            if (header) {
                html += `<div class="title">${Markdrown.escapeHTML(header)}</div>`;
            }
            // Render body with **full block parser**
            html += parserInstance.parse(bodyLines.join('\n'), false); // Don't wrap sections in blockquotes
            html += '</blockquote>';

            return { html, linesUsed: j - i };
        }
    };
}

function strongEmUnderlinePlugin() {
    return {
        type: 'inline',
        priority: 10,
        parse: text => {
            // Order matters: handle underline+bold+italic first, then combos, then single.
            // underline+bold+italic (***++text++***)
            text = text.replace(
                /\*\*\*\+\+([\s\S]+?)\+\+\*\*\*/g,
                (m, a) => `<u><strong><em>${Markdrown.escapeHTML(a)}</em></strong></u>`
            );
            // bold+italic (***text*** or ___text___ or **_text_** or *__text__*)
            text = text.replace(
                /(\*\*\*|___)([\s\S]+?)\1/g,
                (m, a, b) => `<strong><em>${Markdrown.escapeHTML(b)}</em></strong>`
            );
            text = text.replace(
                /\*\*_(.+?)_\*\*/g,
                (m, a) => `<strong><em>${Markdrown.escapeHTML(a)}</em></strong>`
            );
            text = text.replace(
                /\*__(.+?)__\*/g,
                (m, a) => `<strong><em>${Markdrown.escapeHTML(a)}</em></strong>`
            );
            // underline+bold (e.g. **++text++** or ++**text**++)
            text = text.replace(
                /\*\*\+\+([\s\S]+?)\+\+\*\*/g,
                (m, a) => `<u><strong>${Markdrown.escapeHTML(a)}</strong></u>`
            );
            text = text.replace(
                /\+\+\*\*([\s\S]+?)\*\*\+\+/g,
                (m, a) => `<u><strong>${Markdrown.escapeHTML(a)}</strong></u>`
            );
            // underline+italic (*++text++* or ++*text*++)
            text = text.replace(
                /\*\+\+([\s\S]+?)\+\+\*/g,
                (m, a) => `<u><em>${Markdrown.escapeHTML(a)}</em></u>`
            );
            text = text.replace(
                /\+\+\*([\s\S]+?)\*\+\+/g,
                (m, a) => `<u><em>${Markdrown.escapeHTML(a)}</em></u>`
            );
            // underline ( ++text++ )
            text = text.replace(
                /\+\+([\s\S]+?)\+\+/g,
                (m, a) => `<u>${Markdrown.escapeHTML(a)}</u>`
            );
            // bold (**text** or __text__)
            text = text.replace(
                /\*\*([\s\S]+?)\*\*/g,
                (m, a) => `<strong>${Markdrown.escapeHTML(a)}</strong>`
            );
            text = text.replace(
                /__([\s\S]+?)__/g,
                (m, a) => `<strong>${Markdrown.escapeHTML(a)}</strong>`
            );
            // italic (*text* or _text_)
            text = text.replace(
                /\*([\s\S]+?)\*/g,
                (m, a) => `<em>${Markdrown.escapeHTML(a)}</em>`
            );
            text = text.replace(
                /_([\s\S]+?)_/g,
                (m, a) => `<em>${Markdrown.escapeHTML(a)}</em>`
            );
            return text;
        }
    };
}

function lucideIconPlugin() {
    return {
        type: 'inline',
        priority: 2, // High priority, before images/links
        parse: text => text.replace(
            /&([a-zA-Z0-9_-]+)&/g,
            (m, iconName) => {
                // Normalize: lowercase, dashes
                let normalized = iconName
                    .trim()
                    .toLowerCase()
                    .replace(/[_\s]+/g, '-');
                return `<i data-lucide="${Markdrown.escapeHTML(normalized)}"></i>`;
            }
        )
    };
}

function cssGridPlugin(parserInstance) {
    return {
        type: 'block',
        priority: 13,
        parse: (lines, i, inline) => {
            if (!/^#~/.test(lines[i])) return;

            let j = i + 1;
            let title = '';
            let topLevelClass = '';

            // Support: #~ !classname Title
            const titleMatch = lines[i].match(/^#~(?:\s*!([^\s]+(?:\s+[^\s]+)*))?\s*(.+)?$/);
            if (titleMatch) {
                if (titleMatch[1]) topLevelClass = titleMatch[1].trim();
                if (titleMatch[2]) title = titleMatch[2].trim();
            }

            // Collect lines until #!~
            let gridLines = [];
            while (j < lines.length && !/^#!~\s*$/.test(lines[j])) {
                gridLines.push(lines[j]);
                j++;
            }
            if (j >= lines.length || !/^#!~\s*$/.test(lines[j])) return;
            j++;

            // Parse cells
            let cells = [];
            let currCell = null;

            // #4 !class left
            const cellHeader = /^#([1-9]|1[0-2])(?:\s+!([^\s]+(?:\s+[^\s]+)*))?(?:\s+(left|center|right|start|end))?\s*$/;

            for (let k = 0; k < gridLines.length; k++) {
                const line = gridLines[k];
                const match = line.match(cellHeader);

                if (match) {
                    if (currCell) cells.push(currCell);
                    currCell = {
                        width: parseInt(match[1], 10),
                        customClass: match[2] ? match[2].trim() : '',
                        align: match[3] ? match[3].replace('left', 'start').replace('right', 'end') : null,
                        content: []
                    };
                } else if (currCell) {
                    currCell.content.push(line);
                }
            }
            if (currCell) cells.push(currCell);

            // Render
            let html = `<div class="grid-container${topLevelClass ? ' ' + topLevelClass : ''}">`;
            if (title) html += `<div class="grid-title">${Markdrown.escapeHTML(title)}</div>`;

            for (const cell of cells) {
                let cellClass = `col-${cell.width}`;
                if (cell.customClass) cellClass += ` ${cell.customClass}`;
                if (cell.align) cellClass += ` justify-${cell.align}`;
                let cellContent = cell.content.length
                    ? parserInstance.parse(cell.content.join('\n'), false) // Don't wrap sections in grid cells
                    : '';
                html += `<div class="${cellClass}">${cellContent}</div>`;
            }

            html += `</div>`;

            return {
                html,
                linesUsed: (j - i)
            };
        }
    };
}

function hrPlugin() {
    return {
        type: 'block',
        priority: 25, // after code, before lists/tables
        parse: (lines, i) => {
            // Matches: '---', '***', '___', with optional spaces, min 3
            if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(lines[i])) {
                return { html: '<hr>', linesUsed: 1 };
            }
        }
    };
}

function linebreakPlugin() {
    return {
        type: 'inline',
        priority: 3, // before links/images/em
        parse: text => 
            // Replace double-backslash with <br>
            text.replace(/\\\\/g, '<br>')
    };
}

function strikethroughPlugin() {
    return {
        type: 'inline',
        priority: 12,
        parse: text => text.replace(/~~(.*?)~~/g, (m, a) => `<del>${Markdrown.escapeHTML(a)}</del>`)
    }
}

/**
 * HTML Passthrough Plugin for Markdrown
 */
function htmlPassthroughPlugin() {
    return {
        type: 'block',
        priority: 1, // Very high priority - run before most other plugins
        parse: (lines, i, _inline) => {
            const line = lines[i];
            // More comprehensive HTML detection including:
            // - Opening/closing tags: <div>, </div>
            // - Self-closing tags: <br/>, <img/>
            // - Comments: <!-- -->
            // - DOCTYPE declarations
            // - Content within tags (not just tag start)
            const htmlTagRegex = /^\s*<(?:[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?\/?>|\/[a-zA-Z][a-zA-Z0-9]*\s*>|!(?:--.*?--|DOCTYPE\s))/i;
            
            if (!htmlTagRegex.test(line)) {
                return; // Not an HTML line, let other plugins handle it
            }
            
            // Collect HTML lines until we hit an empty line
            let htmlLines = [];
            let j = i;
            
            while (j < lines.length) {
                const currentLine = lines[j];
                
                // Stop at empty line (end of HTML block)
                if (currentLine.trim() === '') {
                    break;
                }
                
                htmlLines.push(currentLine);
                j++;
            }
            
            // Return the HTML content without any processing
            // No escaping, no inline processing - pure passthrough
            return {
                html: htmlLines.join('\n'),
                linesUsed: j - i
            };
        }
    };
}

/**
 * Anchor Link Plugin for Markdrown
 * Adds clickable anchor links to h3 and h4 headings
 */
function anchorLinkPlugin() {
    return {
        type: 'block',
        priority: 1000, // Very low priority - run after all other plugins to modify existing headings
        parse: () => {
            // This plugin doesn't parse markdown, it only does post-render DOM manipulation
            return null;
        },
        postRender: (registerCallback) => {
            registerCallback((container) => {
                if (!container) return;
                
                try {
                    // Find all h3 and h4 elements with IDs
                    const headings = container.querySelectorAll('h3[id], h4[id]');
                
                headings.forEach(heading => {
                    // Skip if already has anchor link
                    if (heading.querySelector('.anchor-link')) return;
                    
                    // Create anchor link button
                    const anchorLink = document.createElement('button');
                    anchorLink.className = 'anchor-link';
                    anchorLink.innerHTML = '<i data-lucide="link"></i>';
                    anchorLink.setAttribute('aria-label', 'Copy link to this section');
                    anchorLink.setAttribute('title', 'Copy link to this section');
                    
                    // Add click handler
                    anchorLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        try {
                            // Get current URL with anchor
                            const url = new URL(window.location);
                            url.hash = '#' + heading.id;
                            
                            // Copy to clipboard
                            await navigator.clipboard.writeText(url.toString());
                            
                            // Visual feedback - turn green briefly
                            anchorLink.classList.add('copied');
                            setTimeout(() => {
                                anchorLink.classList.remove('copied');
                            }, 2000);
                            
                        } catch (err) {
                            console.warn('Failed to copy link:', err);
                            // Fallback for older browsers using deprecated execCommand
                            try {
                                const textArea = document.createElement('textarea');
                                const url = new URL(window.location);
                                url.hash = '#' + heading.id;
                                textArea.value = url.toString();
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                                
                                // Visual feedback
                                anchorLink.classList.add('copied');
                                setTimeout(() => {
                                    anchorLink.classList.remove('copied');
                                }, 2000);
                            } catch (fallbackErr) {
                                console.warn('Copy fallback also failed:', fallbackErr);
                            }
                        }
                    });
                    
                    // Add a space before the anchor link
                    heading.appendChild(document.createTextNode(' '));
                    // Add anchor link after the heading text
                    heading.appendChild(anchorLink);
                });
                
                // Let the existing Lucide initialization handle the icons
                // No need to call lucide.createIcons() here as it's handled elsewhere
                } catch (error) {
                    console.warn('Anchor link plugin error:', error);
                }
            });
        }
    };
}