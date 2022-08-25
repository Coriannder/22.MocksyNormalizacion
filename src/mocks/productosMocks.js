import { faker } from '@faker-js/faker';

faker.locale = 'es'


let id = 0
export const nextId = () => {
    id++
    return id
}


export const createProduct = (id) => {
    return {
        id: id,
        title: faker.word.noun(),
        price: faker.commerce.price() ,
        thumbnail: faker.image.abstract( 640 , 480 , true)
    }
}

export const createManyProducts = (cant) => {
    let result = []
    for(let i = 0 ; i < cant ; i++ ) {
        result.push(createProduct(nextId()))
    }
    return result;
}
