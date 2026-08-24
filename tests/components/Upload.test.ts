/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Upload
 */

import { Upload } from '../../src/components/Upload';

describe('Upload', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="upload" id="upload-el"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('upload-el') as HTMLElement;
        const instance = new Upload(el);

        expect(instance).toBeDefined();
        expect(Upload.getInstance(el)).toBe(instance);
    });

    test('applique les options par défaut', () => {
        expect(Upload.defaults).toBeDefined();
    });

    test('getFiles retourne un tableau vide initialement', () => {
        const el = document.getElementById('upload-el') as HTMLElement;
        const instance = new Upload(el);

        expect(instance.getFiles()).toEqual([]);
    });

    test('clear vide les fichiers', () => {
        const el = document.getElementById('upload-el') as HTMLElement;
        const instance = new Upload(el);

        instance.clear();
        expect(instance.getFiles()).toEqual([]);
    });

    test('destroy nettoie l\'instance', () => {
        const el = document.getElementById('upload-el') as HTMLElement;
        const instance = new Upload(el);

        instance.destroy();
        expect(Upload.getInstance(el)).toBeFalsy();
    });
});
