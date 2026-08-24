/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Pricing
 */

import { Pricing } from '../../src/components/Pricing';

describe('Pricing', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="pricing" id="pricing">
        <div class="pricing__billing-toggle">
          <div class="button-segmented">
            <button type="button" class="button-segmented__btn button-segmented__btn--active">Monthly</button>
            <button type="button" class="button-segmented__btn">Yearly</button>
          </div>
        </div>
        <span class="pricing__price" data-monthly="29" data-yearly="24">$29</span>
      </div>
    `;
  });

  it('devrait créer une instance avec les options par défaut', () => {
    const el = document.getElementById('pricing') as HTMLElement;
    const instance = new Pricing(el);
    expect(instance).toBeDefined();
    expect(Pricing.defaults.billingPeriod).toBe('monthly');
    expect(el.classList.contains('pricing')).toBe(true);
    expect(el.dataset.billing).toBe('monthly');
  });

  it('devrait exposer getInstance et retourner la même instance', () => {
    const el = document.getElementById('pricing') as HTMLElement;
    const instance = new Pricing(el);
    expect(Pricing.getInstance(el)).toBe(instance);
  });

  it('devrait basculer les prix en mode annuel', () => {
    const el = document.getElementById('pricing') as HTMLElement;
    const instance = new Pricing(el);
    const priceEl = el.querySelector('.pricing__price') as HTMLElement;

    instance.setBillingPeriod('yearly');
    expect(instance.getBillingPeriod()).toBe('yearly');
    expect(el.dataset.billing).toBe('yearly');
    expect(priceEl.textContent).toBe('$24');
  });

  it('devrait initialiser via Pricing.init', () => {
    const el = document.getElementById('pricing') as HTMLElement;
    const one = Pricing.init(el) as Pricing;
    expect(one).toBeInstanceOf(Pricing);
    expect(Pricing.getInstance(el)).toBe(one);
  });

  it('devrait détruire l\'instance proprement', () => {
    const el = document.getElementById('pricing') as HTMLElement;
    const instance = new Pricing(el);
    expect(Pricing.getInstance(el)).toBe(instance);
    instance.destroy();
    expect(Pricing.getInstance(el)).toBeUndefined();
  });
});
