const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputMdPath = path.resolve(__dirname, '../SEMIFINAL_AUDIT.md');
const outputHtmlPath = path.resolve(__dirname, '../SEMIFINAL_AUDIT.html');
const outputPdfPath = path.resolve(__dirname, '../SEMIFINAL_AUDIT.pdf');

function markdownToHtml(md) {
  const lines = md.split('\n');
  let html = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;
  let listType = 'ul';

  function closeList() {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
    }
  }

  function closeTable() {
    if (inTable) {
      html.push('</tbody></table></div>');
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>');
        inCodeBlock = false;
      } else {
        closeList();
        closeTable();
        codeBlockLang = line.trim().slice(3).trim();
        html.push(`<pre><code class="language-${codeBlockLang}">`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Escape HTML in code block
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      html.push(escaped);
      continue;
    }

    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      closeList();
      closeTable();
      continue;
    }

    // Horizontal Rule
    if (/^---+$|^\*\*\*+$/.test(trimmed)) {
      closeList();
      closeTable();
      html.push('<hr class="divider" />');
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      closeList();
      closeTable();
      html.push(`<h1 class="doc-title">${formatInline(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeList();
      closeTable();
      html.push(`<h2 class="section-title">${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      closeList();
      closeTable();
      html.push(`<h3 class="subsection-title">${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      closeList();
      closeTable();
      html.push(`<h4 class="sub-subsection-title">${formatInline(trimmed.slice(5))}</h4>`);
      continue;
    }

    // Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if it's separator row
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = false;
        html.push('<div class="table-container"><table><thead><tr>');
        cells.forEach(cell => {
          html.push(`<th>${formatInline(cell)}</th>`);
        });
        html.push('</tr></thead><tbody>');
      } else {
        html.push('<tr>');
        cells.forEach(cell => {
          html.push(`<td>${formatInline(cell)}</td>`);
        });
        html.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // Bullet lists
    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        html.push('<ul>');
      }
      const content = trimmed.replace(/^[-*+]\s+/, '');
      html.push(`<li>${formatInline(content)}</li>`);
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        html.push('<ol>');
      }
      const content = trimmed.replace(/^\d+\.\s+/, '');
      html.push(`<li>${formatInline(content)}</li>`);
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      closeList();
      html.push(`<blockquote>${formatInline(trimmed.replace(/^>\s*/, ''))}</blockquote>`);
      continue;
    }

    // Normal paragraph
    closeList();
    html.push(`<p>${formatInline(trimmed)}</p>`);
  }

  closeList();
  closeTable();
  return html.join('\n');
}

function formatInline(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/🟢/g, '<span class="status-badge pass">🟢</span>')
    .replace(/🔴/g, '<span class="status-badge fail">🔴</span>')
    .replace(/🟡/g, '<span class="status-badge warn">🟡</span>')
    .replace(/✅/g, '<span class="status-badge pass">✅</span>')
    .replace(/❌/g, '<span class="status-badge fail">❌</span>')
    .replace(/⚠️/g, '<span class="status-badge warn">⚠️</span>');
}

async function run() {
  console.log('Reading:', inputMdPath);
  const mdContent = fs.readFileSync(inputMdPath, 'utf8');
  const bodyHtml = markdownToHtml(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HarvestMitra AI — Semifinal Comprehensive Project Audit</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-banner {
      border-bottom: 2px solid #16a34a;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-badge {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .doc-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.2;
      border-left: 5px solid #16a34a;
      padding-left: 12px;
    }
    .section-title {
      font-size: 13.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: avoid;
    }
    .subsection-title {
      font-size: 11.5pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    .sub-subsection-title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p {
      margin: 6px 0;
    }
    ul, ol {
      margin: 6px 0 10px 0;
      padding-left: 22px;
    }
    li {
      margin-bottom: 4px;
    }
    .table-container {
      margin: 14px 0;
      width: 100%;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8.5pt;
      overflow-x: auto;
      margin: 10px 0;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    code {
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9pt;
      background: #f1f5f9;
      color: #0969da;
      padding: 1.5px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }
    blockquote {
      border-left: 4px solid #16a34a;
      margin: 10px 0;
      padding: 6px 14px;
      background: #f0fdf4;
      color: #166534;
      font-style: italic;
      page-break-inside: avoid;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0;
    }
    .status-badge {
      display: inline-block;
      margin-right: 2px;
    }
    a {
      color: #0284c7;
      text-decoration: none;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div><strong>HarvestMitra AI</strong> &bull; Official Technical Assessment</div>
    <div class="header-badge">Confidential QA Report</div>
  </div>

  ${bodyHtml}

  <div class="footer">
    <div>HarvestMitra AI &bull; Full-Stack Agritech & APMC Logistics Platform</div>
    <div>Lead Auditor & Senior QA Assessment</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputHtmlPath, fullHtml, 'utf8');
  console.log('Generated HTML at:', outputHtmlPath);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserBin = fs.existsSync(chromePath) ? chromePath : (fs.existsSync(edgePath) ? edgePath : null);

  if (!browserBin) {
    console.error('Neither Chrome nor Edge was found for headless PDF printing.');
    process.exit(1);
  }

  console.log(`Using browser for PDF compilation: ${browserBin}`);
  const cmd = `"${browserBin}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "file:///${outputHtmlPath.replace(/\\/g, '/')}"`;
  
  console.log('Compiling PDF...');
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log(`✅ PDF GENERATED SUCCESSFULLY!`);
    console.log(`   Path: ${outputPdfPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('❌ PDF compilation failed.');
    process.exit(1);
  }
}

run().catch(console.error);
