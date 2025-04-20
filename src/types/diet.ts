// 餐次类型
export const MealType = ['breakfast', 'lunch', 'dinner', 'snack']

export const mealTypeWithLabel = [
    { id: 'breakfast', label: '早餐' },
    { id: 'lunch', label: '午餐' },
    { id: 'dinner', label: '晚餐' },
    { id: 'snack', label: '加餐' },
];

  // 食品类型
export const categoryTranslations: { [key: string]: string } = {
    'cereal': '谷物类',
    'meat': '肉类',
    'vegetable': '蔬菜类',
    'fruit': '水果类',
    'dairyProducts': '奶制品',
    'beanProducts': '豆制品',
    'oilsAndFats': '油脂类',
    'snack': '零食',
    'drink': '饮料',
};

export const foodTranslations: { [key: string]: string } = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
};

export const foodCategories = [
    'cereal',
    'meat',
    'vegetable',
    'fruit',
    'dairyProducts',
    'beanProducts',
    'oilsAndFats',
    'snack',
    'drink',
];