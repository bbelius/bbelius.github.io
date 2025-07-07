import { Markdrown } from '../markdrown.js';

export function featuresPlugin(parserInstance) {
    return {
        type: 'block',
        priority: 14,
        
        postRender: (registerCallback) => {
            registerCallback(container => {
                container.querySelectorAll('.feature-list').forEach(section => {
                    if (section._featureExpansionInitialized) return;
                    section._featureExpansionInitialized = true;

                    const featureItems = section.querySelectorAll('li[data-feature]');
                    const featureDescriptions = section.querySelectorAll('.feature-description');
                    let currentlyActive = null;

                    section.addEventListener('click', (e) => {
                        const item = e.target.closest('li[data-feature]');
                        if (!item) return;
                        e.preventDefault();

                        const featureId = item.getAttribute('data-feature');
                        const targetDescription = section.querySelector(`.feature-description[data-feature="${featureId}"]`);

                        // Collapse if clicking the same item
                        if (currentlyActive === item) {
                            item.classList.remove('active');
                            targetDescription.classList.remove('active');
                            currentlyActive = null;
                            return;
                        }

                        // Switch to new item
                        featureItems.forEach(f => f.classList.remove('active'));
                        featureDescriptions.forEach(desc => desc.classList.remove('active'));

                        item.classList.add('active');
                        targetDescription.classList.add('active');
                        currentlyActive = item;
                    });

                });
            });
        },
        
        parse: (lines, i, inline) => {
            // Check if line starts with !features
            const startMatch = lines[i].match(/^!features\s*(.*)$/);
            if (!startMatch) return;
            
            const sectionTitle = startMatch[1].trim() || 'Features';
            
            // Find the closing !/features
            let j = i + 1;
            let featureLines = [];
            while (j < lines.length && !/^!\/features\s*$/.test(lines[j])) {
                featureLines.push(lines[j]);
                j++;
            }
            
            if (j >= lines.length || !/^!\/features\s*$/.test(lines[j])) {
                return; // No closing tag found
            }
            j++; // Include the closing line
            
            // Parse individual features
            const features = [];
            let tags = [];
            let currentFeature = null;
            
            for (let k = 0; k < featureLines.length; k++) {
                const line = featureLines[k];
                
                
                // Check for tag line (starts with %)
                const tagMatch = line.match(/^%\s*(.+)$/);
                if (tagMatch) {
                    const tagText = tagMatch[1].trim();
                    if (tagText) {
                        tags = tagText.split(',').map(tag => tag.trim()).filter(tag => tag);
                    }
                    continue;
                }
                // Feature definition line: * feature-id | icon | Display Name
                const featureMatch = line.match(/^\*\s+([a-z0-9-]+)\s*\|\s*([a-z0-9-]+)\s*\|\s*(.+)$/);
                
                if (featureMatch) {
                    if (currentFeature) features.push(currentFeature);
                    currentFeature = {
                        id: featureMatch[1].trim(),
                        icon: featureMatch[2].trim(),
                        title: featureMatch[3].trim(),
                        meta: '',
                        content: []
                    };
                } else if (currentFeature) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        // Check if this is a description line (starts with /)
                        if (trimmedLine.startsWith('/')) {
                            if (!currentFeature.meta) {
                                currentFeature.meta = trimmedLine.substring(1).trim();
                            } else {
                                currentFeature.content.push(trimmedLine);
                            }
                        } else {
                            // All other lines go to content (no automatic meta assignment)
                            currentFeature.content.push(trimmedLine);
                        }
                    }
                }
            }
            if (currentFeature) features.push(currentFeature);
            
            // Generate HTML
            let html = `<div class="feature-list">
                <ul>`;
            for (const feature of features) {
                html += `
                    <li data-feature="${Markdrown.escapeHTML(feature.id)}">
                        <i data-lucide="${Markdrown.escapeHTML(feature.icon)}" class="lucide"></i>
                        ${Markdrown.escapeHTML(feature.title)}
                    </li>`;
            }
            html += `
                </ul>
                <div class="feature-descriptions">`;
            for (const feature of features) {
                const contentHtml = feature.content.length > 0
                    ? inline(feature.content)
                    : '';
                html += `
                    <div class="feature-description" data-feature="${Markdrown.escapeHTML(feature.id)}">
                        <h4>
                            <i data-lucide="${Markdrown.escapeHTML(feature.icon)}" class="lucide"></i>
                            ${Markdrown.escapeHTML(feature.title)}
                        </h4>`;
                if (feature.meta) {
                    html += `
                        <div class="feature-meta">${Markdrown.escapeHTML(feature.meta)}</div>`;
                }
                if (contentHtml) {
                    html += `
                        <div class="feature-content">
                            ${contentHtml}
                        </div>`;
                }
                // Add tags if present (inside each feature description)
                if (tags.length > 0) {
                    html += `<div class="feature-tags">`;
                    for (const tag of tags) {
                        // Support markdown links in tags
                        // Check if tag is a markdown link
                        const linkMatch = tag.match(/\[(.+)\]\((.+)\)/);
                        
                        if (linkMatch) {
                            // It's a markdown link - manually create the anchor with icon inside
                            const linkText = linkMatch[1];
                            const linkUrl = linkMatch[2];
                            html += `<span class="tag"><a href="${Markdrown.escapeHTML(linkUrl)}">${Markdrown.escapeHTML(linkText)}<i data-lucide="external-link"></i></a></span>`;
                        } else {
                            // Regular tag - process normally
                            html += `<span class="tag">${inline([tag])}</span>`;
                        }
                    }
                    html += `</div>`;
                }
                html += `
                    </div>`;
            }
            html += `
                </div>
            </div>`;
            
            return {
                html,
                linesUsed: j - i
            };
        }
    };
}
