import Capacitor
import StoreKit

@objc(InAppPurchase)
public class InAppPurchasePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "InAppPurchase"
    public let jsName = "InAppPurchase"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds")
            return
        }

        if #available(iOS 15.0, *) {
            Task {
                do {
                    let products = try await Product.products(for: Set(productIds))
                    let result = products.map { product -> [String: Any] in
                        var item: [String: Any] = [
                            "id": product.id,
                            "displayName": product.displayName,
                            "description": product.description,
                            "displayPrice": product.displayPrice,
                            "price": NSDecimalNumber(decimal: product.price).doubleValue,
                            "currencyCode": product.priceFormatStyle.currencyCode ?? "USD"
                        ]
                        if case .autoRenewable = product.type {
                            if let subscription = product.subscription {
                                item["subscriptionPeriod"] = [
                                    "unit": String(describing: subscription.subscriptionPeriod.unit),
                                    "value": subscription.subscriptionPeriod.value
                                ]
                            }
                        }
                        return item
                    }
                    call.resolve(["products": result])
                } catch {
                    call.reject("Failed to fetch products: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("StoreKit 2 requires iOS 15.0 or later")
        }
    }

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        if #available(iOS 15.0, *) {
            Task {
                do {
                    let products = try await Product.products(for: [productId])
                    guard let product = products.first else {
                        call.reject("Product not found: \(productId)")
                        return
                    }

                    let result = try await product.purchase()
                    switch result {
                    case .success(let verification):
                        switch verification {
                        case .verified(let transaction):
                            await transaction.finish()
                            call.resolve([
                                "success": true,
                                "transactionId": String(transaction.id),
                                "productId": transaction.productID,
                                "originalId": String(transaction.originalID)
                            ])
                        case .unverified(_, let error):
                            call.reject("Transaction unverified: \(error.localizedDescription)")
                        }
                    case .userCancelled:
                        call.reject("Purchase cancelled by user")
                    case .pending:
                        call.reject("Purchase is pending approval")
                    @unknown default:
                        call.reject("Unknown purchase result")
                    }
                } catch {
                    call.reject("Purchase failed: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("StoreKit 2 requires iOS 15.0 or later")
        }
    }

    @objc func getActiveSubscriptions(_ call: CAPPluginCall) {
        if #available(iOS 15.0, *) {
            Task {
                var activeIds: [String] = []
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result {
                        if transaction.revocationDate == nil {
                            activeIds.append(transaction.productID)
                        }
                    }
                }
                call.resolve(["subscriptions": activeIds])
            }
        } else {
            call.resolve(["subscriptions": []])
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        if #available(iOS 15.0, *) {
            Task { @MainActor in
                guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
                    call.reject("No window scene available")
                    return
                }
                do {
                    try await AppStore.showManageSubscriptions(in: windowScene)
                    call.resolve()
                } catch {
                    call.reject("Failed to open subscription management: \(error.localizedDescription)")
                }
            }
        } else {
            // Fallback: open App Store subscriptions settings URL
            if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            }
            call.resolve()
        }
    }
}
