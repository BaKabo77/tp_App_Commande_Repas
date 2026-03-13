import { TropPauvreErreur, User } from "./user.js";
import { Meal, Order } from "./meals.js";

const STORAGE_KEY = "orders";

const userName = prompt("Quel est votre nom ?") || "Anonyme";
const walletInput = prompt(`Bonjour ${userName}, quel est votre solde initial (€) ?`);
const walletAmount = parseFloat(walletInput ?? "0") || 0;

const user = new User(1, userName, walletAmount);

function saveOrders(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.orders));
}

function loadOrders(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved) as Array<Partial<Order>>;
        user.orders = parsed.map((order) => ({
            id: order.id ?? Date.now(),
            meals: order.meals ?? [],
            total: order.total ?? 0,
            paiemntMethod: order.paiemntMethod ?? "cash",
            userName: order.userName ?? "Utilisateur inconnu",
        }));
    }
}

async function getMeals(): Promise<Meal[]> {
    try {
        const response = await fetch("https://keligmartin.github.io/api/meals.json");
        return await response.json();
    } catch (error) {
        console.log("Erreur lors du chargement des repas");
        return [];
    }
}

function displayWallet(): void {
    const walletEl = document.getElementById("walletDisplay");
    const nameEl = document.getElementById("userName");
    if (walletEl) walletEl.textContent = user.getBalance().toString();
    console.log(user.getBalance());
    if (nameEl) nameEl.textContent = user.name;
}

function displayOrders(): void {
    const orderList = document.getElementById("orderList");
    const totalEl = document.getElementById("totalSpent");
    if (!orderList) return;

    orderList.innerHTML = "";

    if (user.orders.length === 0) {
        orderList.innerHTML = "<li class='list-group-item text-muted'>Aucune commande</li>";
        if (totalEl) totalEl.textContent = "0";
        return;
    }

    const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);

    user.orders.forEach((order) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `${order.userName} — Commande #${order.id} — ${order.meals.map(m => m.name).join(", ")} — ${order.total}EUR`;
        orderList.appendChild(item);
    });

    if (totalEl) totalEl.textContent = totalSpent.toString();
}

function clearOrders(): void {
    user.orders = [];
    localStorage.removeItem(STORAGE_KEY);
    displayOrders();
    displayWallet();
}

function displayMeals(meals: Meal[]): void {
    const mealList = document.getElementById("mealList");

    if (!mealList) {
        return;
    }

    mealList.innerHTML = "";

    meals.forEach((meal) => {
        const item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center";

        const text = document.createElement("span");
        text.textContent = `${meal.name} - ${meal.price}EUR`;

        const button = document.createElement("button");
        button.className = "btn btn-sm btn-primary";
        button.textContent = "Commander";
        button.addEventListener("click", () => {
            try {
                user.orderMeal(meal, "cash");
                saveOrders();
                displayWallet();
                displayOrders();
                alert(`${meal.name} commande avec succes`);
            } catch (error) {
                if (error instanceof TropPauvreErreur) {
                    alert(error.message);
                    return;
                }

                alert("Erreur lors de la commande");
            }
        });

        console.log(meal);

        item.appendChild(text);
        item.appendChild(button);
        mealList.appendChild(item);
    });
}

async function main(): Promise<void> {
    loadOrders();
    displayWallet();
    displayOrders();
    const meals = await getMeals();
    displayMeals(meals);

    document.getElementById("clearOrdersBtn")?.addEventListener("click", clearOrders);
}

main();

