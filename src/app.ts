import { TropPauvreErreur, User } from "./user.js";
import { Meal, Order } from "./meals.js";
import { fetchMeals } from "./api.js";

const STORAGE_KEY = "orders";
const CUSTOM_MEALS_STORAGE_KEY = "customMeals";
const MENU_STORAGE_KEY = "menuMeals";

const userName = prompt("Quel est votre nom ?") || "Anonyme";
const walletInput = prompt(`Bonjour ${userName}, quel est votre solde initial (€) ?`);
const walletAmount = parseFloat(walletInput ?? "0") || 0;

const user = new User(1, userName, walletAmount);
type MealDraft = Partial<Meal>;
type MealsById = Record<number, Meal>;

let allMeals: Meal[] = [];
let customMeals: Meal[] = [];
let menuMeals: Meal[] = [];

function buildMealsById(meals: Meal[]): MealsById {
    return meals.reduce((acc, meal) => {
        acc[meal.id] = meal;
        return acc;
    }, {} as MealsById);
}

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
            userName: order.userName ?? "Utilisateur inconnu",
        }));
    }
}

function saveCustomMeals(): void {
    localStorage.setItem(CUSTOM_MEALS_STORAGE_KEY, JSON.stringify(customMeals));
}

function loadCustomMeals(): Meal[] {
    const saved = localStorage.getItem(CUSTOM_MEALS_STORAGE_KEY);
    if (!saved) {
        return [];
    }

    const parsed = JSON.parse(saved) as Meal[];
    return parsed.filter((meal) => meal && typeof meal.id === "number" && typeof meal.name === "string" && typeof meal.price === "number");
}

function saveMenuMeals(): void {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuMeals));
}

function loadMenuMeals(): Meal[] {
    const saved = localStorage.getItem(MENU_STORAGE_KEY);
    if (!saved) {
        return [];
    }

    const parsed = JSON.parse(saved) as Meal[];
    return parsed.filter((meal) => meal && typeof meal.id === "number" && typeof meal.name === "string" && typeof meal.price === "number");
}

function mealFromDraft(draft: MealDraft): Meal | null {
    if (!draft.name || typeof draft.price !== "number" || Number.isNaN(draft.price)) {
        return null;
    }

    return {
        id: Date.now(),
        name: draft.name.trim(),
        price: draft.price,
        calories: draft.calories ?? 0,
    };
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

function updateMenuTotals(): void {
    const totalHT = menuMeals.reduce((sum, meal) => sum + meal.price, 0);
    const totalTTC = totalHT * 1.2;

    const totalHTEl = document.getElementById("menuTotalHT");
    const totalTTCEl = document.getElementById("menuTotalTTC");

    if (totalHTEl) totalHTEl.textContent = totalHT.toFixed(2);
    if (totalTTCEl) totalTTCEl.textContent = totalTTC.toFixed(2);
}

function displayMenu(): void {
    const menuList = document.getElementById("menuList");
    if (!menuList) {
        return;
    }

    menuList.innerHTML = "";

    if (menuMeals.length === 0) {
        menuList.innerHTML = "<li class='list-group-item text-muted'>Aucun repas dans le menu</li>";
        return;
    }

    menuMeals.forEach((meal, index) => {
        const item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center";

        const text = document.createElement("span");
        text.textContent = `${meal.name} - ${meal.price}EUR`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-outline-danger";
        removeBtn.textContent = "Supprimer";
        removeBtn.addEventListener("click", () => {
            menuMeals.splice(index, 1);
            saveMenuMeals();
            displayMenu();
        });

        item.appendChild(text);
        item.appendChild(removeBtn);
        menuList.appendChild(item);
    });

}

function displayMeals(meals: Meal[]): void {
    const mealList = document.getElementById("mealList");

    if (!mealList) {
        return;
    }

    mealList.innerHTML = "";

    const customMealIds = new Set(customMeals.map((meal) => meal.id));

    const mealsById = buildMealsById(meals);

    Object.keys(mealsById).forEach((id) => {
        const meal = mealsById[Number(id)];
        const item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center";

        const text = document.createElement("span");
        text.textContent = `${meal.name} - ${meal.price}EUR`;

        if (customMealIds.has(meal.id)) {
            const badge = document.createElement("span");
            badge.className = "badge bg-secondary ms-2";
            badge.textContent = "Cree";
            text.appendChild(badge);
        }

        const actions = document.createElement("div");
        actions.className = "d-flex gap-2";

        const orderBtn = document.createElement("button");
        orderBtn.className = "btn btn-sm btn-primary";
        orderBtn.textContent = "Commander";
        orderBtn.addEventListener("click", () => {
            try {
                user.orderMeal(meal);
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

        const addToMenuBtn = document.createElement("button");
        addToMenuBtn.className = "btn btn-sm btn-outline-success";
        addToMenuBtn.textContent = "Ajouter menu";
        addToMenuBtn.addEventListener("click", () => {
            menuMeals.push(meal);
            saveMenuMeals();
            displayMenu();
        });

        console.log(meal);

        item.appendChild(text);
        actions.appendChild(orderBtn);
        actions.appendChild(addToMenuBtn);
        item.appendChild(actions);
        mealList.appendChild(item);
    });
}

function setupCreateMealForm(): void {
    const nameInput = document.getElementById("mealName") as HTMLInputElement | null;
    const caloriesInput = document.getElementById("mealCalories") as HTMLInputElement | null;
    const priceInput = document.getElementById("mealPrice") as HTMLInputElement | null;
    const addBtn = document.getElementById("addMealBtn");

    if (!nameInput || !caloriesInput || !priceInput || !addBtn) {
        return;
    }

    addBtn.addEventListener("click", () => {
        const draft: MealDraft = {
            name: nameInput.value.trim(),
            price: parseFloat(priceInput.value),
            calories: caloriesInput.value ? parseFloat(caloriesInput.value) : undefined,
        };

        const meal = mealFromDraft(draft);
        if (!meal) {
            alert("Nom et prix sont obligatoires");
            return;
        }

        customMeals.push(meal);
        allMeals = [...allMeals, meal];
        saveCustomMeals();
        displayMeals(allMeals);

        nameInput.value = "";
        caloriesInput.value = "";
        priceInput.value = "";
    });
}

async function main(): Promise<void> {
    loadOrders();
    customMeals = loadCustomMeals();
    menuMeals = loadMenuMeals();
    displayWallet();
    displayOrders();
    displayMenu();
    const meals = await fetchMeals();
    allMeals = [...meals, ...customMeals];
    displayMeals(allMeals);
    setupCreateMealForm();

    document.getElementById("clearOrdersBtn")?.addEventListener("click", clearOrders);
    document.getElementById("calculateMenuBtn")?.addEventListener("click", updateMenuTotals);
}

main();

