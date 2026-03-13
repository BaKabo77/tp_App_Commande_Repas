import { Meal } from "./meals.js";

export async function fetchMeals(): Promise<Meal[]> {
    try {
        const response = await fetch("https://keligmartin.github.io/api/meals.json");
        return await response.json();
    } catch (error) {
        console.log("Erreur lors du chargement des repas");
        return [];
    }
}
