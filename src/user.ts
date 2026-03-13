import { Meal, Order, PaiemantMethod } from "./meals.js";

export type Wallet = number | { main: number; bonus?: number };

export class TropPauvreErreur extends Error {
    available: number;
    required: number;
    missing: number;

    constructor(available: number, required: number) {
        super(
            `Fonds insuffisants: disponible=${available}EUR, requis=${required}EUR, manque=${required - available}EUR`
        );
        this.name = "TropPauvreErreur";
        this.available = available;
        this.required = required;
        this.missing = required - available;
    }
}

export class User {
    id: number;
    name: string;
    wallet: Wallet;
    orders: Order[];

    constructor(id: number, name: string, wallet: Wallet) {
        this.id = id;
        this.name = name;
        this.wallet = wallet;
        this.orders = [];
    }

    getBalance(): number {
        if (typeof this.wallet === "number") {
            return this.wallet;
        }

        return this.wallet.main + (this.wallet.bonus ?? 0);
    }

    private debit(amount: number): void {
        if (typeof this.wallet === "number") {
            this.wallet -= amount;
            return;
        }

        const remaining = this.getBalance() - amount;
        this.wallet.main = remaining;
        this.wallet.bonus = 0;
    }

    orderMeal(meal: Meal, paiementMethod: PaiemantMethod): Order {
        const total = meal.price;
        const balance = this.getBalance();
        if (balance < total) {
            throw new TropPauvreErreur(balance, total);
        }

        const order: Order = {
            id: Date.now(),
            meals: [meal],
            total,
            paiemntMethod: paiementMethod,
        };

        this.debit(total);
        this.orders.push(order);
        return order;
    }
}