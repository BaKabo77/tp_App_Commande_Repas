type PaiemantMethod = 'cash' | 'card' | 'mobile';

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
  paiemntMethod: PaiemantMethod
}

export { Meal, Order, PaiemantMethod };