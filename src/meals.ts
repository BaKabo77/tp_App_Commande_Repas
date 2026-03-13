
type Meal = {
  id: number
  name: string
  calories: number
  price: number
}

type Order = {
  id: number
  meals: Meal[]
  total: number
  userName?: string
}

export { Meal, Order };