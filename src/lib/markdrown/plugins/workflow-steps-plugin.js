import { Markdrown } from '../markdrown.js';

export function workflowStepsPlugin(parserInstance) {
    return {
        type: 'block',
        priority: 14,
        
        parse: (lines, i, inline) => {
            // Check if line starts with !workflow
            const startMatch = lines[i].match(/^!workflow\s*(.*)$/);
            if (!startMatch) return;
            
            const sectionTitle = startMatch[1].trim() || '';
            
            // Find the closing !/workflow
            let j = i + 1;
            let workflowLines = [];
            while (j < lines.length && !/^!\/workflow\s*$/.test(lines[j])) {
                workflowLines.push(lines[j]);
                j++;
            }
            
            if (j >= lines.length || !/^!\/workflow\s*$/.test(lines[j])) {
                return; // No closing tag found
            }
            j++; // Include the closing line
            
            // Parse individual workflow steps
            const steps = [];
            let currentStep = null;
            
            for (let k = 0; k < workflowLines.length; k++) {
                const line = workflowLines[k];
                
                // Check for step definition line: 1. Title
                const stepMatch = line.match(/^(\d+)\.\s*(.+)$/);
                
                if (stepMatch) {
                    // Save previous step if exists
                    if (currentStep) steps.push(currentStep);
                    
                    // Start new step
                    currentStep = {
                        number: stepMatch[1],
                        title: stepMatch[2].trim(),
                        content: []
                    };
                } else if (currentStep) {
                    // Add content to current step
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        currentStep.content.push(trimmedLine);
                    }
                }
            }
            
            // Add the last step
            if (currentStep) steps.push(currentStep);
            
            // Generate HTML
            let html = '<div class="workflow-steps">';
            
            for (const step of steps) {
                html += `
    <div class="workflow-step" data-step="${Markdrown.escapeHTML(step.number)}">
        <div class="step-header">
            <div class="step-number">${Markdrown.escapeHTML(step.number)}</div>
            <h4 class="step-title">${Markdrown.escapeHTML(step.title)}</h4>
        </div>`;
                
                // Process content with markdown
                if (step.content.length > 0) {
                    const contentHtml = inline(step.content);
                    html += `
        <div class="step-content">
            ${contentHtml}
        </div>`;
                }
                
                html += `
    </div>`;
            }
            
            html += '\n</div>';
            
            return {
                html,
                linesUsed: j - i
            };
        }
    };
}