/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Todo
 */

import { Todo } from '../../src/components/Todo';

describe('Todo', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="todo"></div>';
        // Nettoyer localStorage
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('initialise et stocke l\'instance sur l\'élément', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        expect(instance).toBeDefined();
        expect(Todo.getInstance(el)).toBe(instance);
        expect(el.classList.contains('todo')).toBe(true);
    });

    test('Todo initialise avec la structure DOM correcte', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        expect(el.querySelector('.todo__add')).toBeTruthy();
        expect(el.querySelector('.todo__input')).toBeTruthy();
        expect(el.querySelector('.todo__add-button')).toBeTruthy();
        expect(el.querySelector('.todo__list')).toBeTruthy();
        expect(el.querySelector('.todo__filters')).toBeTruthy();
    });

    test('Todo initialise avec items par défaut', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        expect(instance.getItems().length).toBe(0);
    });

    test('Todo initialise avec items initiaux', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const items = [
            { id: '1', text: 'Tâche 1', completed: false },
            { id: '2', text: 'Tâche 2', completed: true }
        ];
        const instance = new Todo(el, { items });

        expect(instance.getItems().length).toBe(2);
        expect(instance.getItems()[0].text).toBe('Tâche 1');
        expect(instance.getItems()[1].completed).toBe(true);
    });

    test('Todo initialise avec filtre par défaut', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        expect(instance.getFilter()).toBe('all');
    });

    test('Todo initialise avec filtre depuis attribut', () => {
        const el = document.getElementById('todo') as HTMLElement;
        el.setAttribute('data-filter', 'active');
        const instance = new Todo(el);

        expect(instance.getFilter()).toBe('active');
    });

    test('Todo addItem ajoute une tâche', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        const item = instance.addItem('Nouvelle tâche');

        expect(item).toBeDefined();
        expect(item.text).toBe('Nouvelle tâche');
        expect(item.completed).toBe(false);
        expect(instance.getItems().length).toBe(1);
    });

    test('Todo removeItem supprime une tâche', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        const item = instance.addItem('Tâche à supprimer');
        const removed = instance.removeItem(item.id);

        expect(removed).toBe(true);
        expect(instance.getItems().length).toBe(0);
    });

    test('Todo removeItem retourne false si tâche non trouvée', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        const removed = instance.removeItem('id-inexistant');

        expect(removed).toBe(false);
    });

    test('Todo handleToggle bascule l\'état d\'une tâche', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        const item = instance.addItem('Tâche à toggle');
        expect(item.completed).toBe(false);

        instance.handleToggle(item.id);
        const updatedItem = instance.getItems().find(i => i.id === item.id);
        expect(updatedItem?.completed).toBe(true);

        instance.handleToggle(item.id);
        const updatedItem2 = instance.getItems().find(i => i.id === item.id);
        expect(updatedItem2?.completed).toBe(false);
    });

    test('Todo setFilter change le filtre', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        instance.addItem('Tâche active');
        instance.addItem('Tâche terminée');
        const items = instance.getItems();
        items[1].completed = true;

        instance.setFilter('active');
        expect(instance.getFilter()).toBe('active');
        expect(instance.getFilteredItems().length).toBe(1);

        instance.setFilter('completed');
        expect(instance.getFilter()).toBe('completed');
        expect(instance.getFilteredItems().length).toBe(1);

        instance.setFilter('all');
        expect(instance.getFilter()).toBe('all');
        expect(instance.getFilteredItems().length).toBe(2);
    });

    test('Todo clearCompleted supprime toutes les tâches terminées', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        instance.addItem('Tâche active 1');
        instance.addItem('Tâche active 2');
        instance.addItem('Tâche terminée 1');
        instance.addItem('Tâche terminée 2');

        const items = instance.getItems();
        items[2].completed = true;
        items[3].completed = true;

        instance.clearCompleted();

        expect(instance.getItems().length).toBe(2);
        expect(instance.getItems().every(i => !i.completed)).toBe(true);
    });

    test('Todo getInstance retourne l\'instance existante', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance1 = new Todo(el);
        const instance2 = Todo.getInstance(el);

        expect(instance2).toBe(instance1);
    });

    test('Todo init avec élément unique retourne une instance', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = Todo.init(el);

        expect(instance).toBeInstanceOf(Todo);
        expect(Todo.getInstance(el)).toBe(instance);
    });

    test('Todo init avec plusieurs éléments retourne un tableau', () => {
        document.body.innerHTML = `
            <div class="todo" id="todo1"></div>
            <div class="todo" id="todo2"></div>
        `;
        const elements = document.querySelectorAll('.todo');
        const instances = Todo.init(elements);

        expect(Array.isArray(instances)).toBe(true);
        expect(instances.length).toBe(2);
        instances.forEach(instance => {
            expect(instance).toBeInstanceOf(Todo);
        });
    });

    test('Todo déclenche onAdd lors de l\'ajout', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const onAdd = jest.fn();
        const instance = new Todo(el, { onAdd });

        instance.addItem('Nouvelle tâche');

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Nouvelle tâche',
                completed: false,
            }),
            instance
        );
    });

    test('Todo déclenche onRemove lors de la suppression', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const onRemove = jest.fn();
        const instance = new Todo(el, { onRemove });

        const item = instance.addItem('Tâche à supprimer');
        instance.removeItem(item.id);

        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onRemove).toHaveBeenCalledWith(item, instance);
    });

    test('Todo déclenche onToggle lors du toggle', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const onToggle = jest.fn();
        const instance = new Todo(el, { onToggle });

        const item = instance.addItem('Tâche à toggle');
        instance.handleToggle(item.id);

        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(onToggle).toHaveBeenCalledWith(
            expect.objectContaining({
                id: item.id,
                completed: true,
            }),
            instance
        );
    });

    test('Todo déclenche onFilterChange lors du changement de filtre', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const onFilterChange = jest.fn();
        const instance = new Todo(el, { onFilterChange });

        instance.setFilter('active');

        expect(onFilterChange).toHaveBeenCalledTimes(1);
        expect(onFilterChange).toHaveBeenCalledWith('active', instance);
    });

    test('Todo sauvegarde dans localStorage si activé', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el, {
            persistToStorage: true,
            storageKey: 'test-todo'
        });

        instance.addItem('Tâche persistée');

        const stored = localStorage.getItem('test-todo');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.length).toBe(1);
        expect(parsed[0].text).toBe('Tâche persistée');
    });

    test('Todo charge depuis localStorage si activé', () => {
        const items = [
            { id: '1', text: 'Tâche chargée', completed: false }
        ];
        localStorage.setItem('test-todo', JSON.stringify(items));

        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el, {
            persistToStorage: true,
            storageKey: 'test-todo'
        });

        expect(instance.getItems().length).toBe(1);
        expect(instance.getItems()[0].text).toBe('Tâche chargée');
    });

    test('Todo ne sauvegarde pas si persistToStorage est false', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el, {
            persistToStorage: false,
            storageKey: 'test-todo'
        });

        instance.addItem('Tâche non persistée');

        const stored = localStorage.getItem('test-todo');
        expect(stored).toBeNull();
    });

    test('Todo defaults retourne les options par défaut', () => {
        const defaults = Todo.defaults;
        expect(defaults).toBeDefined();
        expect(defaults.items).toEqual([]);
        expect(defaults.filter).toBe('all');
        expect(defaults.persistToStorage).toBe(false);
        expect(defaults.showCounter).toBe(true);
        expect(defaults.showClearCompleted).toBe(true);
    });

    test('Todo destroy nettoie l\'instance', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        instance.destroy();
        expect(Todo.getInstance(el)).toBeFalsy();
    });

    test('Todo getFilteredItems retourne les tâches filtrées', () => {
        const el = document.getElementById('todo') as HTMLElement;
        const instance = new Todo(el);

        instance.addItem('Tâche active');
        instance.addItem('Tâche terminée');
        const items = instance.getItems();
        items[1].completed = true;

        instance.setFilter('active');
        const activeItems = instance.getFilteredItems();
        expect(activeItems.length).toBe(1);
        expect(activeItems[0].completed).toBe(false);

        instance.setFilter('completed');
        const completedItems = instance.getFilteredItems();
        expect(completedItems.length).toBe(1);
        expect(completedItems[0].completed).toBe(true);

        instance.setFilter('all');
        const allItems = instance.getFilteredItems();
        expect(allItems.length).toBe(2);
    });
});










