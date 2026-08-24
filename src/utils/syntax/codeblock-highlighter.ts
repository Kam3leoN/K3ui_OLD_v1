/**
 * @fileoverview Coloration syntaxique intégrée pour CodeBlock (sans dépendance externe)
 * @description Supporte html, php, javascript, typescript, lua, css, scss, sass, xml, sql, markup, markdown
 * @author K3UI Team
 * @version 1.0.0
 */

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const wrap = (cls: string, text: string): string =>
    `<span class="codeblock__token codeblock__token--${cls}">${escapeHtml(text)}</span>`;

/** Alias de langues (language-xxx) vers clé interne */
const LANGUAGE_ALIASES: Record<string, string> = {
    html: 'html',
    php: 'php',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    lua: 'lua',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    xml: 'xml',
    sql: 'sql',
    mysql: 'sql',
    sqlite: 'sql',
    markup: 'markup',
    markdown: 'markdown',
    md: 'markdown',
};

/**
 * Détecte la langue depuis la classe du code (language-xxx)
 */
export function getLanguageFromElement(codeEl: HTMLElement): string {
    const m = codeEl.className.match(/\blanguage-([\w-]+)/i);
    const raw = m ? m[1].toLowerCase() : '';
    return LANGUAGE_ALIASES[raw] || raw || 'plain';
}

/**
 * Colore le code selon la langue (composant indépendant, pas de Prism)
 */
export function highlight(code: string, language: string): string {
    const lang = LANGUAGE_ALIASES[language.toLowerCase()] || language.toLowerCase();
    if (!code || lang === 'plain') return escapeHtml(code);

    const highlighter = HIGHLIGHTERS[lang];
    if (highlighter) return highlighter(code);
    return escapeHtml(code);
}

type HighlighterFn = (code: string) => string;

function applyRules(code: string, rules: Array<{ pattern: RegExp; type: string }>): string {
    const str = code;
    const matches: { index: number; end: number; type: string; text: string; order: number }[] = [];
    rules.forEach(({ pattern, type }, order) => {
        const re = new RegExp(pattern.source, pattern.flags);
        let m;
        while ((m = re.exec(str)) !== null) {
            matches.push({
                index: m.index,
                end: m.index + m[0].length,
                type,
                text: m[0],
                order,
            });
        }
    });
    matches.sort((a, b) => a.index - b.index || a.order - b.order);
    const merged: typeof matches = [];
    for (const m of matches) {
        if (merged.some((x) => m.index < x.end && m.end > x.index)) continue;
        merged.push(m);
    }
    merged.sort((a, b) => a.index - b.index);
    let out = '';
    let lastIndex = 0;
    for (const m of merged) {
        if (m.index > lastIndex) out += escapeHtml(str.slice(lastIndex, m.index));
        out += wrap(m.type, m.text);
        lastIndex = m.end;
    }
    if (lastIndex < str.length) out += escapeHtml(str.slice(lastIndex));
    return out || escapeHtml(str);
}

// —— HTML / Markup ——
function highlightHtml(code: string): string {
    return applyRules(code, [
        { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
        { pattern: /<!--[\s\S]*?-->/g, type: 'comment' },
        { pattern: /<!DOCTYPE[\s\S]*?>/gi, type: 'doctype' },
        { pattern: /<\/?[\w][\w-]*(?:\s|>)/g, type: 'tag' },
        { pattern: /[\w-]+(?=\s*=)/g, type: 'attr' },
    ]);
}

// —— PHP (PHP + HTML) ——
function highlightPhp(code: string): string {
    const parts: { raw: string; lang: string }[] = [];
    const re = /(<\?php[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[\s\S]*?>|<\/?[\w][\w-]*(?:\s[^>]*)?\/?>)/gi;
    let last = 0;
    let match;
    while ((match = re.exec(code)) !== null) {
        if (match.index > last) parts.push({ raw: code.slice(last, match.index), lang: 'html' });
        const raw = match[1];
        if (/<\?php/i.test(raw)) {
            const inner = raw.replace(/^<\?php\s?/i, '').replace(/\?>$/, '');
            parts.push({ raw: inner, lang: 'php' });
        } else {
            parts.push({ raw, lang: 'html' });
        }
        last = match.index + match[0].length;
    }
    if (last < code.length) parts.push({ raw: code.slice(last), lang: 'html' });

    return parts
        .map((p) => {
            if (p.lang === 'html') return highlightHtml(p.raw);
            return applyRules(p.raw, [
                { pattern: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, type: 'comment' },
                { pattern: /\b(and|or|xor|array|as|break|case|catch|class|clone|const|continue|declare|default|do|else|elseif|extends|final|finally|for|foreach|function|global|goto|if|implements|interface|instanceof|insteadof|namespace|new|private|protected|public|return|static|switch|throw|trait|try|use|var|while|yield|echo|print|die|exit|list)\b/gi, type: 'keyword' },
                { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
                { pattern: /\$[\w]+/g, type: 'variable' },
                { pattern: /\b(\d+\.?\d*)\b/g, type: 'number' },
            ]);
        })
        .join('');
}

// —— JavaScript / TypeScript ——
function highlightJavascript(code: string): string {
    return applyRules(code, [
        { pattern: /\/\/[^\n]*/g, type: 'comment' },
        { pattern: /\/\*[\s\S]*?\*\//g, type: 'comment' },
        { pattern: /`(?:[^`\\]|\\.)*`/g, type: 'string' },
        { pattern: /"(?:[^"\\]|\\.)*"/g, type: 'string' },
        { pattern: /'(?:[^'\\]|\\.)*'/g, type: 'string' },
        { pattern: /\/[^*\n][^/]*\/[gimsuy]*/g, type: 'regex' },
        { pattern: /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|throw|try|typeof|var|void|while|with|yield|as|interface|type|enum|implements|namespace|abstract|declare|readonly|private|protected|public)\b/g, type: 'keyword' },
        { pattern: /\b(true|false|null|undefined)\b/g, type: 'constant' },
        { pattern: /\b(0x[\da-fA-F]+|0o[0-7]+|0b[01]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/g, type: 'number' },
    ]);
}

// —— Lua ——
function highlightLua(code: string): string {
    return applyRules(code, [
        { pattern: /--\[\[[\s\S]*?\]\]/g, type: 'comment' },
        { pattern: /--[^\n]*/g, type: 'comment' },
        { pattern: /"(?:[^"\\]|\\.)*"/g, type: 'string' },
        { pattern: /'(?:[^'\\]|\\.)*'/g, type: 'string' },
        { pattern: /\[\[[\s\S]*?\]\]/g, type: 'string' },
        { pattern: /\b(and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g, type: 'keyword' },
        { pattern: /\b(\d+\.?\d*)\b/g, type: 'number' },
    ]);
}

// —— CSS / SCSS / SASS ——
function highlightCss(code: string): string {
    return applyRules(code, [
        { pattern: /\/\*[\s\S]*?\*\//g, type: 'comment' },
        { pattern: /#[\da-fA-F]{3,8}\b/g, type: 'number' },
        { pattern: /(url|var)\s*\(/g, type: 'function' },
        { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
        { pattern: /\b(\d+\.?\d*(?:px|em|rem|%|deg|s|ms)?)\b/g, type: 'number' },
        { pattern: /(\.[\w-]+|#[\w-]+|[\w-]+)(?=\s*\{)/g, type: 'selector' },
        { pattern: /([\w-]+)\s*:/g, type: 'attr' },
        { pattern: /\$[\w-]+/g, type: 'variable' },
        { pattern: /&|@(?:import|mixin|include|extend|if|else|for|each|while|function)\b/g, type: 'keyword' },
    ]);
}

// —— XML ——
function highlightXml(code: string): string {
    return applyRules(code, [
        { pattern: /<\?[\s\S]*?\?>/g, type: 'comment' },
        { pattern: /<!--[\s\S]*?-->/g, type: 'comment' },
        { pattern: /<\/?[\w][\w-.:]*/g, type: 'tag' },
        { pattern: /[\w-]+(?=\s*=)/g, type: 'attr' },
        { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
    ]);
}

// —— SQL ——
function highlightSql(code: string): string {
    return applyRules(code, [
        { pattern: /--[^\n]*/g, type: 'comment' },
        { pattern: /\/\*[\s\S]*?\*\//g, type: 'comment' },
        { pattern: /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|PRIMARY|KEY|REFERENCES|FOREIGN|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|INT|INTEGER|VARCHAR|TEXT|REAL|BLOB|DATE|DATETIME|BOOLEAN)\b/gi, type: 'keyword' },
        { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
        { pattern: /\b(\d+\.?\d*)\b/g, type: 'number' },
    ]);
}

// —— Python ——
function highlightPython(code: string): string {
    return applyRules(code, [
        { pattern: /#.*$/gm, type: 'comment' },
        { pattern: /"""[\s\S]*?"""/g, type: 'string' },
        { pattern: /'''[\s\S]*?'''/g, type: 'string' },
        { pattern: /"(?:[^"\\]|\\.)*"/g, type: 'string' },
        { pattern: /'(?:[^'\\]|\\.)*'/g, type: 'string' },
        { pattern: /@[\w.]+\b/g, type: 'keyword' },
        { pattern: /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g, type: 'keyword' },
        { pattern: /\b(True|False|None)\b/g, type: 'constant' },
        { pattern: /\b(0x[\da-fA-F]+|0o[0-7]+|0b[01]+|\d+\.?\d*(?:e[+-]?\d+)?j?)\b/g, type: 'number' },
    ]);
}

// —— Markdown ——
function highlightMarkdown(code: string): string {
    return applyRules(code, [
        { pattern: /^#{1,6}\s+.+$/gm, type: 'tag' },
        { pattern: /(\*\*|__)(.+?)\1/g, type: 'keyword' },
        { pattern: /(\*|_)(.+?)\1/g, type: 'attr' },
        { pattern: /`[^`]+`/g, type: 'string' },
        { pattern: /\[([^\]]+)\]\([^)]+\)/g, type: 'selector' },
        { pattern: /^[-*+]\s+/gm, type: 'punctuation' },
        { pattern: /^\d+\.\s+/gm, type: 'number' },
        { pattern: /<!--[\s\S]*?-->/g, type: 'comment' },
    ]);
}

// Markup = HTML
const HIGHLIGHTERS: Record<string, HighlighterFn> = {
    html: highlightHtml,
    markup: highlightHtml,
    php: highlightPhp,
    javascript: highlightJavascript,
    typescript: highlightJavascript,
    python: highlightPython,
    lua: highlightLua,
    css: highlightCss,
    scss: highlightCss,
    sass: highlightCss,
    xml: highlightXml,
    sql: highlightSql,
    markdown: highlightMarkdown,
};