import { TropPauvreErreur, User } from "./user.js";
import { Meal } from "./meals.js";

const STORAGE_KEY = "orders";
const user = new User(1, "Bob", 30);

function saveOrders(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.orders));
}

function loadOrders(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        user.orders = JSON.parse(saved);
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
    if (!orderList) return;

    orderList.innerHTML = "";

    if (user.orders.length === 0) {
        orderList.innerHTML = "<li class='list-group-item text-muted'>Aucune commande</li>";
        return;
    }

    user.orders.forEach((order) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `Commande #${order.id} — ${order.meals.map(m => m.name).join(", ")} — ${order.total}EUR`;
        orderList.appendChild(item);
    });
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
}

main();

