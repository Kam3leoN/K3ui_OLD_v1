type RegistryMap = Record<string, HTMLElement[]>;

let assignRegistry: (registry: RegistryMap) => void = () => {};

export function registerRegistryAssigner(fn: (registry: RegistryMap) => void): void {
    assignRegistry = fn;
}

export function assignAutoinitRegistry(registry: RegistryMap): void {
    assignRegistry(registry);
}
