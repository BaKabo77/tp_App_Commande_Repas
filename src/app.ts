import { User } from "./user";
import { Meal } from "./meals";

async function getMeals(): Promise<Meal[]> {
    try {
        const response = await fetch("https://keligmartin.github.io/api/meals.json");
        return await response.json();
    } catch (error) {
        console.log("Erreur lors du chargement des repas");
        return [];
    }
}

function displayMeals(meals: Meal[]): void {
    const mealList = document.getElementById("mealList");

    if (!mealList) {
        return;
    }

    mealList.innerHTML = "";

    meals.forEach((meal) => {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = `${meal.name} - ${meal.price}EUR`;
        mealList.appendChild(item);
    });
}

async function main(): Promise<void> {
    const meals = await getMeals();
    displayMeals(meals);
}

main();

