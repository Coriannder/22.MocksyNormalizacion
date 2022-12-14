
import express from 'express'
import { Server as HttpServer }  from 'http'
import { Server as IOServer } from 'socket.io'
import { createManyProducts } from './mocks/productosMocks.js'
import { productosDao , mensajesDao } from './daos/index.js'
import { normalizador , desnormalizador } from './myNormalizr/myNormalizr.js'
import util from 'util'

const app = express()
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)


function print(objeto){           // para imprimir en consola objetos normalizados
    console.log(util.inspect(objeto, false, 12, true))
}

const norm = normalizador(await mensajesDao.listarAll())
const desnorm = desnormalizador(norm)

console.log('----------------------------------mensajes Normalizados----------------------------------')
print(norm)
console.log('-----------------------------------------------------------------------')


console.log('----------------------------------mensajes Desnormalizados----------------------------------')
print(desnorm)
console.log('-----------------------------------------------------------------------')





//------------------Configuracion EJS---------------------------------//
app.set('views', './views')
app.set('view engine', 'ejs')


app.get('/api/productos-test', (req, res) => {
    res.render('pages/index')
})



//-----------Containers Knex para Bases de Datos MySQL y SQLite3-----------//

import { optionMySQL , optionSQLite } from "./options/options.js";
import { ContainerDB } from "./container/container.js";

const containerProducts = new ContainerDB(optionMySQL)
const containerMessages = new ContainerDB(optionSQLite)


const pp = await productosDao.borrarTodo()
console.log('-------------------pp-------------------')
//console.log(pp)



const prod = createManyProducts(5)       // Mockeo 5 productos
prod.forEach(elem => {
    productosDao.guardar(elem)
})

//const mens = createManyMesagges(5)       // Mockeo 10 mensajes
//console.log(mens)

await containerProducts.newTable()           // Creo tabla porducts
await containerMessages.newTable()           // Creo tabla messages
await containerProducts.save(prod)           // Guardo porductos en tabla products
//console.log(await productosDao.listarAll())


//--------------------------Websockets----------------------------//

io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado!')

    /* Envio los productos y mensajes al cliente que se conect?? */
    socket.emit('products', await productosDao.listarAll())
    socket.emit('messages', await mensajesDao.listarAll())

    /* Escucho el nuevo producto enviado por el cliente y se los propago a todos */
    socket.on('newProduct', async (newProduct) => {
            await productosDao.guardar(newProduct)
            console.log(newProduct)
            io.sockets.emit('products', await productosDao.listarAll())
        })

    /* Escucho el nuevo mensaje de chat enviado por el cliente y se los propago a todos */
    socket.on('newMessage', async (res) =>{
        console.log('------------------------------mensaje escuchado-------------------------------')
        console.log(res)
        console.log('------------------------------------------------------------------------------')
        await mensajesDao.guardar(res)

        io.sockets.emit('messages', await mensajesDao.listarAll())
    })
})


//------------------Configuracion Server---------------------------------//

const PORT = 8080
const server = httpServer.listen(PORT, ()=>{
    console.log(`Servidor escuchando en el puerto ${server.address().port}`)
})
server.on(`error`, error => console.log(`Error en servidor: ${error}`))
