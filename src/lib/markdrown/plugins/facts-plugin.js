import { Markdrown } from '../markdrown.js';

export function factsPlugin(parserInstance) {
    return {
        type: 'block',
        priority: 14,
        
        parse: (lines, i, inline) => {
            // Check if line starts with !facts
            const startMatch = lines[i].match(/^!facts\s*(.*)$/);
            if (!startMatch) return;
            
            const containerid = startMatch[1].trim() || 'facts';
            
            // Find the closing !/facts
            let j = i + 1;
            let factLines = [];
            while (j < lines.length && !/^!\/facts\s*$/.test(lines[j])) {
                factLines.push(lines[j]);
                j++;
            }
            
            if (j >= lines.length || !/^!\/facts\s*$/.test(lines[j])) {
                return; // No closing tag found
            }
            j++; // Include the closing line
            
            // Parse individual facts
            const facts = [];
            let currentFact = null;
            
            for (let k = 0; k < factLines.length; k++) {
                const line = factLines[k];
                
                // Fact definition line: * item-id | lucide-icon-name | color-class | Title
                const factMatch = line.match(/^\*\s+([a-z0-9-]+)\s*\|\s*([a-z0-9-]+)\s*\|\s*([a-z0-9-]+)\s*\|\s*(.+)$/);
                
                if (factMatch) {
                    if (currentFact) facts.push(currentFact);
                    currentFact = {
                        id: factMatch[1].trim(),
                        icon: factMatch[2].trim(),
                        color: factMatch[3].trim(),
                        title: factMatch[4].trim(),
                        content: []
                    };
                } else if (currentFact) {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        // All non-empty lines become content
                        currentFact.content.push(trimmedLine);
                    }
                }
            }
            if (currentFact) facts.push(currentFact);
            
            // Generate HTML
            let html = `<div class="facts-grid">`;
            
            for (const fact of facts) {
                const contentHtml = fact.content.length > 0
                    ? fact.content.join(' ')
                    : '';
                    
                html += `
                    <div class="facts-card ${Markdrown.escapeHTML(fact.color)}">
                        <div class="facts-icon">
                            <i data-lucide="${Markdrown.escapeHTML(fact.icon)}"></i>
                        </div>
                        <h4>${Markdrown.escapeHTML(fact.title)}</h4>
                        <p>${Markdrown.escapeHTML(contentHtml)}</p>
                    </div>`;
            }
            
            html += `</div>`;
            
            return {
                html,
                linesUsed: j - i
            };
        }
    };
}