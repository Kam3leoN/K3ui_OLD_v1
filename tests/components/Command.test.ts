/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Command
 */

import { Command } from '../../src/components/Command';
import type { CommandItem } from '../../src/types/components';

const SAMPLE_COMMANDS: CommandItem[] = [
  { id: 'cmd-1', name: 'Go Home', description: 'Navigate home', icon: 'home', group: 'nav', shortcut: 'G H', action: () => {} },
  { id: 'cmd-2', name: 'Settings', description: 'Open settings', icon: 'gear', group: 'nav', action: () => {} },
];

describe('Command', () => {
  let host: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div class="command" id="command-host"></div>';
    host = document.getElementById('command-host') as HTMLElement;
  });

  afterEach(() => {
    const instance = Command.getInstance(host);
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
    document.body.innerHTML = '';
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const instance = new Command(host, {});

    expect(instance).toBeDefined();
    expect(Command.getInstance(host)).toBe(instance);
    expect(Command.defaults).toBeDefined();
    expect(Command.defaults.commands).toEqual([]);
    expect(Command.defaults.shortcutKey).toBe('ctrl+k');
    expect(Command.defaults.showGroups).toBe(true);
    expect(Command.defaults.size).toBe('default');
  });

  it('devrait exposer getInstance', () => {
    const instance = new Command(host, { commands: [] });

    expect(Command.getInstance(host)).toBe(instance);
  });

  it('devrait ouvrir et fermer la palette', () => {
    const instance = new Command(host, { commands: SAMPLE_COMMANDS });

    expect(instance.isOpen).toBe(false);
    instance.open();
    expect(instance.isOpen).toBe(true);
    instance.close();
    expect(instance.isOpen).toBe(false);
  });

  it('devrait mettre à jour les commandes avec setCommands', () => {
    const instance = new Command(host, { commands: [] });

    expect(instance.options.commands).toEqual([]);
    instance.setCommands(SAMPLE_COMMANDS);
    expect(instance.options.commands).toEqual(SAMPLE_COMMANDS);
  });

  it('devrait appeler les callbacks onOpenStart / onCloseEnd', () => {
    const onOpenStart = jest.fn();
    const onCloseEnd = jest.fn();
    const instance = new Command(host, {
      commands: SAMPLE_COMMANDS,
      onOpenStart,
      onCloseEnd,
    });

    instance.open();
    expect(onOpenStart).toHaveBeenCalledWith(host);
    instance.close();
    expect(onCloseEnd).toHaveBeenCalledWith(host);
  });

  it('devrait détruire proprement', () => {
    const instance = new Command(host, { commands: SAMPLE_COMMANDS });

    expect(document.body.querySelector('.command-palette-dialog')).toBeTruthy();
    instance.destroy();
    expect(document.body.querySelector('.command-palette-dialog')).toBeNull();
    expect(Command.getInstance(host)).toBeFalsy();
  });
});
