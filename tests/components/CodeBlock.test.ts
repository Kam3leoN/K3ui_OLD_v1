/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant CodeBlock
 */

import { CodeBlock } from '../../src/components/CodeBlock';

describe('CodeBlock', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it('devrait initialiser correctement avec pre/code', () => {
        const root = document.getElementById('root') as HTMLElement;
        root.innerHTML = '<div class="codeblock"><pre><code class="language-html">&lt;div&gt;test&lt;/div&gt;</code></pre></div>';
        const el = root.querySelector('.codeblock') as HTMLElement;
        const instance = new CodeBlock(el);

        expect(instance).toBeDefined();
        expect(CodeBlock.getInstance(el)).toBe(instance);
        expect(el.querySelector('.codeblock__card')).toBeTruthy();
        expect(el.querySelector('.codeblock__toolbar')).toBeTruthy();
        expect(el.querySelector('.codeblock__content')).toBeTruthy();
        expect(el.getAttribute('role')).toBe('region');
    });

    it('devrait exposer getInstance', () => {
        const root = document.getElementById('root') as HTMLElement;
        root.innerHTML = '<div class="codeblock"><pre><code class="language-html">x</code></pre></div>';
        const el = root.querySelector('.codeblock') as HTMLElement;
        new CodeBlock(el);
        const instance = CodeBlock.getInstance(el);
        expect(instance).toBeDefined();
        expect(instance.highlight).toBeDefined();
    });

    it('devrait utiliser les options par défaut', () => {
        expect(CodeBlock.defaults.showToolbar).toBe(true);
        expect(CodeBlock.defaults.showCopy).toBe(true);
        expect(CodeBlock.defaults.label).toBe('');
    });

    it('devrait accepter options showToolbar: false (toolbar masquée côté CSS)', () => {
        const root = document.getElementById('root') as HTMLElement;
        root.innerHTML = '<div class="codeblock"><pre><code class="language-html">x</code></pre></div>';
        const el = root.querySelector('.codeblock') as HTMLElement;
        const instance = new CodeBlock(el, { showToolbar: false });
        expect(instance.options.showToolbar).toBe(false);
        expect(el.querySelector('.codeblock__card')).toBeTruthy();
    });

    it('devrait détruire proprement', () => {
        const root = document.getElementById('root') as HTMLElement;
        root.innerHTML = '<div class="codeblock"><pre><code class="language-html">x</code></pre></div>';
        const el = root.querySelector('.codeblock') as HTMLElement;
        const instance = new CodeBlock(el);
        instance.destroy();
        expect(CodeBlock.getInstance(el)).toBeFalsy();
    });

    it('devrait initialiser via init() avec un élément', () => {
        const root = document.getElementById('root') as HTMLElement;
        root.innerHTML = '<div class="codeblock"><pre><code class="language-html">x</code></pre></div>';
        const el = root.querySelector('.codeblock') as HTMLElement;
        const instance = CodeBlock.init(el) as CodeBlock;
        expect(instance).toBeInstanceOf(CodeBlock);
        expect(CodeBlock.getInstance(el)).toBe(instance);
    });
});
