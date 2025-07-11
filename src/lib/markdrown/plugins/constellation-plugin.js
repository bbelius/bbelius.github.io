import { Markdrown } from '../markdrown.js';

export function constellationPlugin(parserInstance) {
    return {
        type: 'block',
        priority: 14,
        
        postRender: (registerCallback) => {
            registerCallback(container => {
                container.querySelectorAll('.constellation.frame').forEach(constellation => {
                    if (constellation._constellationInitialized) return;
                    constellation._constellationInitialized = true;

                    const constellationNodes = constellation.querySelectorAll('.constellation .node-btn, .constellation .constellation-node');
                    
                    // Changed: Look for details panel within the same parent frame
                    const constellationFrame = constellation.closest('.constellation.frame');
                    const detailsPanel = constellationFrame ? constellationFrame.querySelector('.constellation .constellation-details') : null;
                    
                    const constellationContents = detailsPanel ? detailsPanel.querySelectorAll('.constellation .constellation-content') : [];
                    let currentlySelected = null;

                    constellation.addEventListener('click', (e) => {
                        const node = e.target.closest('.constellation .node-btn') || e.target.closest('.constellation .constellation-node');
                        if (!node) return;
                        e.preventDefault();

                        const constellationId = node.getAttribute('data-constellation');
                        const targetContent = detailsPanel ? detailsPanel.querySelector(`.constellation .constellation-content[data-constellation="${constellationId}"]`) : null;

                        // Remove selected state from all nodes
                        constellationNodes.forEach(n => n.classList.remove('selected'));
                        if (constellationContents.length > 0) {
                            constellationContents.forEach(content => content.style.display = 'none');
                        }

                        // Add selected state to clicked node
                        node.classList.add('selected');
                        currentlySelected = node;

                        // Show corresponding content
                        if (targetContent) {
                            targetContent.style.display = 'block';
                        }

                        // Show details panel if hidden
                        if (detailsPanel) {
                            detailsPanel.style.transform = 'translateY(0px)';
                            detailsPanel.style.opacity = '1';
                        }
                    });

                    // Auto-select first node if available
                    if (constellationNodes.length > 0) {
                        const firstNode = constellationNodes[0];
                        firstNode.click();
                    }
                });
            });
        },
        
        parse: (lines, i, inline) => {
            // Check if line starts with !constellation
            const startMatch = lines[i].match(/^!constellation\s*(.*)$/);
            if (!startMatch) return;
            
            const sectionId = startMatch[1].trim() || 'Constellation';
            
            // Find the closing !/constellation
            let j = i + 1;
            let constellationLines = [];
            while (j < lines.length && !/^!\/constellation\s*$/.test(lines[j])) {
                constellationLines.push(lines[j]);
                j++;
            }
            
            if (j >= lines.length || !/^!\/constellation\s*$/.test(lines[j])) {
                return; // No closing tag found
            }
            j++; // Include the closing line
            
            // Parse individual nodes (using features plugin syntax)
            const nodes = [];
            let currentNode = null;
            let pendingMeta = '';
            
            for (let k = 0; k < constellationLines.length; k++) {
                const line = constellationLines[k];
                
                // Node definition line: * node-id | icon | Display Name | Long Title (optional)
                const nodeMatch = line.match(/^\*\s+([a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*(.+?)(?:\s*\|\s*(.+))?$/);
                
                if (nodeMatch) {
                    if (currentNode) nodes.push(currentNode);
                    const iconField = nodeMatch[2].trim();
                    
                    // Check if icon field contains a markdown image link
                    const imageMatch = iconField.match(/^!\[.*?\]\((.+?)\)$/);
                    
                    currentNode = {
                        id: nodeMatch[1].trim(),
                        icon: imageMatch ? null : iconField, // Set icon to null if it's an image
                        image: imageMatch ? imageMatch[1] : null, // Extract image URL from markdown
                        title: nodeMatch[3].trim(),
                        longTitle: nodeMatch[4] ? nodeMatch[4].trim() : nodeMatch[3].trim(), // Use long title if provided, otherwise fall back to title
                        meta: '',
                        content: []
                    };
                    // Apply pending meta if available
                    if (pendingMeta) {
                        currentNode.meta = pendingMeta;
                        pendingMeta = '';
                    }
                } else {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        // Check for meta line (starts with %)
                        const metaMatch = line.match(/^%\s*(.+)$/);
                        if (metaMatch) {
                            const metaText = metaMatch[1].trim();
                            if (currentNode) {
                                if (!currentNode.meta) {
                                    currentNode.meta = metaText;
                                } else {
                                    currentNode.meta += ' ' + metaText;
                                }
                            } else {
                                // Store meta for the next node
                                pendingMeta = metaText;
                            }
                        } else if (currentNode) {
                            // Regular content line
                            currentNode.content.push(trimmedLine);
                        }
                    }
                }
            }
            if (currentNode) nodes.push(currentNode);
            
            if (nodes.length === 0) return;
            
            // Calculate positions for nodes in a perfect circle
            const calculatePositions = (nodeCount) => {
                const positions = [];
                
                const radius = 35; // Percentage from center - ensures perfect circle
                const centerX = 50;
                const centerY = 45;

                // First node is always central
                if (nodeCount > 0) {
                    positions.push({ left: centerX, top: centerY });
                }
                
                // Remaining nodes arranged in perfect circle
                const satelliteCount = nodeCount - 1;
                if (satelliteCount === 0) return positions;
                
                for (let i = 0; i < satelliteCount; i++) {
                    // Start from top (12 o'clock) and distribute evenly clockwise
                    const angle = (i * 2 * Math.PI) / satelliteCount - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    positions.push({
                        left: Math.round(x * 100) / 100, // Higher precision for perfect positioning
                        top: Math.round(y * 100) / 100
                    });
                }
                
                return positions;
            };
            
            const positions = calculatePositions(nodes.length);
            
            // Generate constellation HTML with exact structure specified
            let html = `<div class="constellation frame"><div class="constellation-container">`;
            
            // Generate nodes using exact structure
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const position = positions[i];
                const nodeClass = i === 0 ? 'node-btn central' : 'node-btn satellite';
                
                html += `
<div class="${nodeClass}" data-constellation="${Markdrown.escapeHTML(node.id)}" style="left: ${position.left}%; top: ${position.top}%;">
    <div class="core">`;
                
                if (node.icon) {
                    html += `<i data-lucide="${Markdrown.escapeHTML(node.icon)}"></i>`;
                } else if (node.image) {
                    html += `<img src="${Markdrown.escapeHTML(node.image)}" alt="${Markdrown.escapeHTML(node.title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
                
                html += `
    </div>
    <div class="label">${Markdrown.escapeHTML(node.title)}</div>
</div>`;
            }
            
            html += `</div><hr />`;
            
            // Generate details panel
            html += `
                <div class="constellation-details" data-constellation="${Markdrown.escapeHTML(sectionId)}">`;
            
            // Generate content for each node
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const displayStyle = i === 0 ? 'block' : 'none';
                const contentHtml = node.content.length > 0 ? inline(node.content) : '';
                
                html += `
                        <div class="constellation-content" data-constellation="${Markdrown.escapeHTML(node.id)}" style="display: ${displayStyle};">
                            <div class="panel-icon">`;
                
                if (node.icon) {
                    html += `<i data-lucide="${Markdrown.escapeHTML(node.icon)}" class="lucide"></i>`;
                } else if (node.image) {
                    html += `<img src="${Markdrown.escapeHTML(node.image)}" alt="${Markdrown.escapeHTML(node.title)} profile photo" width="34" height="34">`;
                }
                
                html += `</div>
<div class="panel-text"><h4>${Markdrown.escapeHTML(node.longTitle || node.title)}</h4>`;
                
                if (contentHtml) {
                    html += `<p>${contentHtml}</p>`;
                }
                
                if (node.meta) {
                    html += `<div class="stats">`;
                    
                    // Parse comma-separated meta content
                    const metaParts = node.meta.split(',').map(part => part.trim()).filter(part => part);
                    
                    for (const metaPart of metaParts) {
                        // Handle markdown links in meta content similar to features plugin
                        const linkMatch = metaPart.match(/\[(.+?)\]\((.+?)\)/);
                        if (linkMatch) {
                            // It's a markdown link - manually create the anchor with icon
                            const linkText = linkMatch[1];
                            const linkUrl = linkMatch[2];
                            const beforeLink = metaPart.substring(0, linkMatch.index);
                            const afterLink = metaPart.substring(linkMatch.index + linkMatch[0].length);
                            
                            html += `<span class="stat-item">`;
                            if (beforeLink.trim()) {
                                html += `${Markdrown.escapeHTML(beforeLink.trim())} `;
                            }
                            html += `<a href="${Markdrown.escapeHTML(linkUrl)}">${Markdrown.escapeHTML(linkText)}<i data-lucide="external-link"></i></a>`;
                            if (afterLink.trim()) {
                                html += ` ${Markdrown.escapeHTML(afterLink.trim())}`;
                            }
                            html += `</span>`;
                        } else {
                            // Regular meta content
                            html += `<span class="stat-item">${Markdrown.escapeHTML(metaPart)}</span>`;
                        }
                    }
                    
                    html += `</div>`;
                }
                
                html += `
                            </div>
                        </div>`;
            }
            
            html += `</div></div>`;
            
            return {
                html,
                linesUsed: j - i
            };
        }
    };
}