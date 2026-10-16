#!/usr/bin/env node
// Regenerates the auto-generated Features section of README.md from the
// current contents of js/ and css/. Run by .github/workflows/update-readme.yml
// on every push that touches js/** or css/** — no external dependencies,
// no API calls, so it has no runtime cost beyond the CI minutes.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const CSS_DIR = path.join(ROOT, 'css');
const README_PATH = path.join(ROOT, 'README.md');
const LOADER_FILE = 'script-loader.js';

const START_MARKER = '<!-- AUTO-GENERATED:FEATURES:START -->';
const END_MARKER = '<!-- AUTO-GENERATED:FEATURES:END -->';

function readDirSafe(dir, ext) {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(ext))
        .sort();
}

// Pulls out standalone `//` comment lines that look like section labels
// (skips separators, bare URLs, and trailing/inline comments).
function extractSectionComments(content) {
    const lines = content.split('\n');
    const comments = [];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        const match = line.match(/^\/\/\s*(.+)$/);
        if (!match) continue;

        const text = match[1].trim();
        if (text.length < 3) continue;
        if (/^[-=*#]+$/.test(text)) continue; // separator lines
        if (/^https?:\/\//.test(text)) continue; // bare reference links
        if (/^(TODO|FIXME|eslint)/i.test(text)) continue;
        if (/[(){};=]/.test(text)) continue; // looks like commented-out code, not a label
        if (/^(const|let|var|function|if|return|document\.|window\.)\b/i.test(text)) continue;

        if (comments[comments.length - 1] !== text) comments.push(text);
    }
    return comments.slice(0, 10);
}

// A file where most non-blank lines are `//` comments is disabled/dormant
// code (e.g. an old feature commented out wholesale), not documentation.
function isFullyCommentedOut(content) {
    const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    if (!lines.length) return false;
    const commentLines = lines.filter((l) => l.startsWith('//'));
    return commentLines.length / lines.length > 0.8;
}

function extractExportedFunctions(content) {
    const fns = [];
    const re = /export\s+function\s+(\w+)\s*\(/g;
    let m;
    while ((m = re.exec(content))) fns.push(m[1]);
    return fns;
}

function describeJsFile(file) {
    const content = fs.readFileSync(path.join(JS_DIR, file), 'utf8');
    const fns = extractExportedFunctions(content);

    const heading = fns.length
        ? `### [\`js/${file}\`](js/${file}) — \`${fns.join('()\`, \`')}()\``
        : `### [\`js/${file}\`](js/${file})`;

    if (!fns.length && isFullyCommentedOut(content)) {
        return `${heading}\n\n_Entire file is commented out — not currently active or wired into \`script-loader.js\`._`;
    }

    const comments = extractSectionComments(content);
    if (!comments.length) {
        return `${heading}\n\n_No inline section comments found — see source for details._`;
    }

    return `${heading}\n\n${comments.map((c) => `- ${c}`).join('\n')}`;
}

function describeCssFile(file, styleImports) {
    const importedBy = styleImports.includes(file)
        ? 'Imported by `css/styles.css`.'
        : file === 'styles.css'
            ? 'Root stylesheet.'
            : '_Not currently imported by `css/styles.css` — verify it is still in use._';

    return `### [\`css/${file}\`](css/${file})\n\n${importedBy}`;
}

function getStyleImports() {
    const stylesPath = path.join(CSS_DIR, 'styles.css');
    if (!fs.existsSync(stylesPath)) return [];
    // Strip CSS comments first so a commented-out @import isn't counted as active.
    const content = fs.readFileSync(stylesPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /@import\s+url\(['"]?([\w.-]+)['"]?\)/g;
    const imports = [];
    let m;
    while ((m = re.exec(content))) imports.push(m[1]);
    return imports;
}

function build() {
    const jsFiles = readDirSafe(JS_DIR, '.js').filter((f) => f !== LOADER_FILE);
    const cssFiles = readDirSafe(CSS_DIR, '.css');
    const styleImports = getStyleImports();

    const jsSection = jsFiles.map(describeJsFile).join('\n\n');
    const cssSection = cssFiles.map((f) => describeCssFile(f, styleImports)).join('\n\n');

    return [
        '_Regenerated automatically from the current contents of `js/` and `css/` on every push to `main` — see [`scripts/generate-readme.js`](scripts/generate-readme.js) and [`.github/workflows/update-readme.yml`](.github/workflows/update-readme.yml). Do not hand-edit inside this block; edit the script instead._',
        '',
        '## JavaScript modules',
        '',
        jsSection || '_No JS modules found._',
        '',
        '## Stylesheets',
        '',
        cssSection || '_No CSS files found._',
    ].join('\n');
}

function updateReadme() {
    if (!fs.existsSync(README_PATH)) {
        console.error('README.md not found at repo root.');
        process.exit(1);
    }

    const readme = fs.readFileSync(README_PATH, 'utf8');
    const startIdx = readme.indexOf(START_MARKER);
    const endIdx = readme.indexOf(END_MARKER);

    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        console.error(
            `README.md is missing the ${START_MARKER} / ${END_MARKER} markers. Add them around the section to auto-generate.`
        );
        process.exit(1);
    }

    const generated = build();
    const before = readme.slice(0, startIdx + START_MARKER.length);
    const after = readme.slice(endIdx);
    const updated = `${before}\n\n${generated}\n\n${after}`;

    if (updated !== readme) {
        fs.writeFileSync(README_PATH, updated);
        console.log('README.md updated.');
    } else {
        console.log('README.md already up to date.');
    }
}

updateReadme();
