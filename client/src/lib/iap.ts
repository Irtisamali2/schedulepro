// In-App Purchase utilities for Capacitor iOS app
import { isCapacitor } from './capacitor-init';

let iapPlugin: any = null;

async function getPlugin() {
  if (!iapPlugin) {
    const mod = await import('@adplorg/capacitor-in-app-purchase');
    iapPlugin = mod.CapacitorInAppPurchase;
  }
  return iapPlugin;
}

export interface IAPProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  priceInMicros: number;
  currencyCode: string;
}

export async function getIAPProducts(productIds: string[]): Promise<IAPProduct[]> {
  if (!isCapacitor()) return [];
  const plugin = await getPlugin();
  const { products } = await plugin.getProducts({ productIds });
  return products;
}

export async function getIAPProduct(productId: string): Promise<IAPProduct | null> {
  if (!isCapacitor()) return null;
  const plugin = await getPlugin();
  const { product } = await plugin.getProduct({ productId });
  return product;
}

export async function purchaseSubscription(productId: string): Promise<string> {
  const plugin = await getPlugin();
  const referenceUUID = crypto.randomUUID();
  const { transaction } = await plugin.purchaseSubscription({
    productId,
    referenceUUID,
  });
  return transaction;
}

export async function getActiveSubscriptions(): Promise<string[]> {
  if (!isCapacitor()) return [];
  const plugin = await getPlugin();
  const { subscriptions } = await plugin.getActiveSubscriptions();
  return subscriptions;
}

export async function manageSubscriptions(): Promise<void> {
  if (!isCapacitor()) return;
  const plugin = await getPlugin();
  await plugin.manageSubscriptions({});
}

export function addTransactionListener(callback: (event: { type: 'success' | 'error'; transaction?: string; message?: string }) => void) {
  if (!isCapacitor()) return () => {};
  let removeListener: (() => void) | null = null;
  getPlugin().then((plugin: any) => {
    plugin.addListener('transaction', callback).then((handle: any) => {
      removeListener = () => handle.remove();
    });
  });
  return () => removeListener?.();
}
