// In-App Purchase utilities for Capacitor iOS app
// Uses a local Capacitor plugin (InAppPurchasePlugin.swift) with StoreKit 2
import { registerPlugin } from '@capacitor/core';
import { isCapacitor } from './capacitor-init';

interface InAppPurchasePlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: IAPProduct[] }>;
  purchaseProduct(options: { productId: string }): Promise<{
    success: boolean;
    transactionId: string;
    productId: string;
    originalId: string;
  }>;
  getActiveSubscriptions(): Promise<{ subscriptions: string[] }>;
  manageSubscriptions(): Promise<void>;
}

const InAppPurchase = registerPlugin<InAppPurchasePlugin>('InAppPurchase');

export interface IAPProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  price: number;
  currencyCode: string;
}

export async function getIAPProducts(productIds: string[]): Promise<IAPProduct[]> {
  if (!isCapacitor()) return [];
  const { products } = await InAppPurchase.getProducts({ productIds });
  return products;
}

export async function getIAPProduct(productId: string): Promise<IAPProduct | null> {
  if (!isCapacitor()) return null;
  const { products } = await InAppPurchase.getProducts({ productIds: [productId] });
  return products[0] || null;
}

export async function purchaseSubscription(productId: string): Promise<string> {
  const result = await InAppPurchase.purchaseProduct({ productId });
  return result.transactionId;
}

export async function getActiveSubscriptions(): Promise<string[]> {
  if (!isCapacitor()) return [];
  const { subscriptions } = await InAppPurchase.getActiveSubscriptions();
  return subscriptions;
}

export async function manageSubscriptions(): Promise<void> {
  if (!isCapacitor()) return;
  await InAppPurchase.manageSubscriptions();
}
