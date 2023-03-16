import express from "express";
import apiCartRouter from "./src/routes/cart.router.js";
import prodRouter from "./src/routes/product.router.js";
import cookieRouter from "./src/routes/cookie.router.js";
import views from "./src/routes/views.router.js";
import handlebars from "express-handlebars";
import { __dirname } from "./utils.js";
import { Server } from "socket.io";
import ProductManager from "./src/mongoManager/ProductManager.js";
import MsgsManager from "./src/mongoManager/MsgsManager.js";
import CartManager from "./src/mongoManager/cartManager.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import "./src/db/mongo.js";



export const app = express();


const cookieKey = "SignedCookieKey";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser(cookieKey));
app.use(
  session({
    secret: "secretCode",
    resave: false,
    saveUninitialized: true,
  })
);

const path = new ProductManager();
const msgManager = new MsgsManager();
const cartManager = new CartManager();

app.engine(
  "hbs",
  handlebars.engine({
    extname: "hbs",
    defaultLayout: false,
    layoutsDir: "./src/layouts/",
  })
);


app.set("view engine", "hbs");
app.set("views", __dirname + "/src/views")

app.use("/cookies", cookieRouter);

app.use("/", views);
app.use("/api/carts", apiCartRouter);
app.use("/api/products", prodRouter);


/*app.get("/", (req, res) => {
  res.render("home");
});

app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts");
});

app.get("/chat", (req, res) => {
  res.render("chat");
});

app.get("/products", (req, res) => {
    res.render("products");
});*/



export const serverLocal = app.listen("8080", () => {
  console.log("200 OK");
});

const socketServer = new Server(serverLocal);

socketServer.on("connection", (socket) => {
  console.log(`Usuario conectado ${socket.id}`);

  socket.on("showProds", async () => {
    const prods = await path.getProducts();
    socket.emit('prods', prods)
  });

  socket.on('showMsg', async () => {
    const getMsgs = await msgManager.getMsgs();
    socket.emit("msgs", getMsgs);
  })

  socket.on("send", async (e) => {
    const posted = await path.addProduct(e);
    const prods = await path.getProducts();
    socket.emit("alert", posted);
    socket.emit("prods", prods);
  });

  socket.on("delete", async (e) => {
    const deleted = await path.deleteProduct(e);
    const prods = await path.getProducts();
    socket.emit("alert", deleted);
    socket.emit("prods", prods);
  });

  socket.on("msg", async (e) => {
    const sendMsg = await msgManager.sendMsg(e);
    const getMsgs = await msgManager.getMsgs();
    socket.emit("alert", sendMsg);
    socket.emit("msgs", getMsgs);
  });

  socket.on('mongoProds', async () => {
    const getPags = await path.getPagination(1, 10)
    socket.emit('prods', getPags)
  })

  socket.on('addToCart', async (e) => {
    await cartManager.addToCart('64120e7270a755ce7222be24', e._id)
  })
});
