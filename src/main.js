
import express from 'express'
import { Server as HttpServer }  from 'http'
import { Server as IOServer } from 'socket.io'
import { createManyProducts, createProduct, nextId} from './mocks/productosMocks.js'
const app = express()
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)


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

const prod = createManyProducts(15)       // Mockeo 3 productos
console.log(prod)

await containerProducts.newTable()           // Creo tabla porducts
await containerMessages.newTable()           // Creo tabla messages
await containerProducts.save(prod)           // Guardo porductos en tabla products
console.log(await containerProducts.getAll())


//--------------------------Websockets----------------------------//

io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado!')

    /* Envio los productos y mensajes al cliente que se conectó */
    socket.emit('products', await containerProducts.getAll())
    socket.emit('messages', await containerMessages.getAll())

    /* Escucho el nuevo producto enviado por el cliente y se los propago a todos */
    socket.on('newProduct', async (newProduct) => {
            await containerProducts.save(newProduct)
            console.log(newProduct)
            io.sockets.emit('products', await containerProducts.getAll())
        })

    /* Escucho el nuevo mensaje de chat enviado por el cliente y se los propago a todos */
    socket.on('newMessage', async (res) =>{
        await containerMessages.save(res)
        console.log(res)
        io.sockets.emit('messages', await containerMessages.getAll())
    })
})


//------------------Configuracion Server---------------------------------//

const PORT = 8080
const server = httpServer.listen(PORT, ()=>{
    console.log(`Servidor escuchando en el puerto ${server.address().port}`)
})
server.on(`error`, error => console.log(`Error en servidor: ${error}`))
