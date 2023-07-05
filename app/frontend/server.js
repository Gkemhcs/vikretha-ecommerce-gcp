const express=require("express")
const app=express()

const axios=require("axios")
const {PubSub}=require("@google-cloud/pubsub")
const session=require("express-session")
const metadata=require("gcp-metadata")

app.set("view engine","ejs")
app.use(require("body-parser").urlencoded({extended:true}))
app.use(express.json())
app.use(express.static("public"))
app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: true,
    })
  );
  async function publishMessage(data){
    const pubsubClient=new PubSub()
   const topic=pubsubClient.topic(process.env.topicName)
   const messageId=await topic.publishJSON(data)
   console.log(messageId)
   }
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
      next(); // User is authenticated, proceed to the next middleware/route
    } else {
      res.redirect('/login'); // Redirect to the login page if not authenticated
    }
  };
  async function getClusterAttributes(){
    const location=await metadata.instance("attributes/cluster-location")
    const name=await metadata.instance("attributes/cluster-name")
    console.log(name,location)
    return {location,name}
  }
app.get("/register",(req,res)=>{
res.render("userregistration")
})
app.post("/register",async(req,res)=>{
const result=await axios({method:"POST",url:"http://authentication-server.data.svc.cluster.local/register",data:req.body,headers:{'Content-Type':'application/json'}})
if(result.data == 'ok'){
    res.redirect("/login")
}
else{
    res.redirect("/register")
}
})
app.get("/login",(req,res)=>{

    res.render("userlogin")
})
app.post("/login",async(req,res)=>{
    console.log(req.body)
    const response=await axios({method:"POST",url:"http://authentication-server.data.svc.cluster.local/login",data:req.body,headers:{'Content-Type':'application/json'}})
 if(response.data.loginstatus  == "success"){
    req.session.loggedIn=true
    req.session.userid=response.data.userid
    req.session.email=response.data.email 
   
    res.redirect("/")
 }
 if(response.data.loginstatus == "notexists"){
    res.render("registrationerror")
 }
 if(response.data.loginstatus == "incorrect" ){
    res.render("loginerror")
 }
})
app.get("/protected",(req,res)=>{
    email=req.session.email
    id=req.session.userid
    res.send(`hello ${email} ${id}`)
})
app.get("/",isAuthenticated,async(req,res)=>{
const response=await axios.get("http://catalog-data-sender.data.svc.cluster.local/category/home")
const cluster_attr=await getClusterAttributes()
cluster_attr["pod_name"]=process.env.HOSTNAME
res.render("home",{catalog:response.data,cluster:cluster_attr})
})
app.get("/laptops",isAuthenticated,async(req,res)=>{
    const response=await axios.get("http://catalog-data-sender.data.svc.cluster.local/category/laptops")
    res.render("laptops",{catalog:response.data})
})
app.get("/mobiles",isAuthenticated,async(req,res)=>{
    const response=await axios.get("http://catalog-data-sender.data.svc.cluster.local/category/mobiles")
    res.render("phones",{catalog:response.data})
})
app.get("/watches",isAuthenticated,async(req,res)=>{
    const response=await axios.get("http://catalog-data-sender.data.svc.cluster.local/category/watches")
    res.render("watches",{catalog:response.data})
})
app.get("/earbuds",isAuthenticated,async (req,res)=>{
    const response=await axios.get("http://catalog-data-sender.data.svc.cluster.local/category/earbuds")
    res.render("earbuds",{catalog:response.data})
})
app.post("/addtocart/:productId",async(req,res)=>{
    console.log("request recieved")
userId=req.session.userid

productId=req.params.productId
const response=await axios({method:'POST',url:"http://cart-manager.data.svc.cluster.local/add",headers:{'Content-Type':'application/json'},data:{userId,productId}})
console.log(response.data)
if(response.data.status == 'ok'){
    res.json({status:"ok"})
}
else{
    res.json({status:"already_exists"})
}
})

app.get("/product/:productId",isAuthenticated,async(req,res)=>{
    const response=await axios.get(`http://product-info.data.svc.cluster.local/product/${req.params.productId}`)

res.render("product_info",{item:response.data})
    
})    

app.get("/orders",isAuthenticated,async(req,res)=>{
     const response=await axios.get(`http://order-manager.data.svc.cluster.local/orders/${req.session.userid}`)
     
    res.render("orders",{items:response.data})
})
app.get("/orders/cancel/:orderId",isAuthenticated,async(req,res)=>{
    const response=await axios({method:"POST",url:"http://order-manager.data.svc.cluster.local/order/cancel",headers:{'Content-Type':'application/json'},data:{orderId:req.params.orderId}})
   if(response.data.status == 'ok'){
    res.redirect("/orders")
   }
})

app.get("/cart/cancel/:productId", isAuthenticated,async(req,res)=>{
    const response= await axios({method:"POST",url:"http://cart-manager.data.svc.cluster.local/cart/delete",headers:{'Content-Type':'application/json'},data:{productId:req.params.productId,userId:req.session.userid}})
   if(response.data.status == "ok"){
    res.redirect("/cart")
   }
})

app.get("/buy/product/:productId",isAuthenticated,async(req,res)=>{
   const response=await axios.get(`http://product-info.data.svc.cluster.local/buy/${req.params.productId}`)
            res.render("confirmationpage",{item:response.data})
    
 
})
app.get("/logout",(req,res)=>{
    email=req.session.email
    req.session.destroy()
   res.redirect("/login")
})
app.get("/cart",isAuthenticated,async(req,res)=>{
    const userid=req.session.userid 
    
    const response=await axios.get(`http://cart-manager.data.svc.cluster.local/cart/${userid}`)
    console.log("response",response.data.items)
    res.render("cart",{items:response.data.items})
})
app.get("/order/:productId",isAuthenticated,async(req,res)=>{
const response=await axios({method:"POST",url:"http://order-manager.data.svc.cluster.local/create-order",headers:{'Content-Type':'application/json'},data:{userid:req.session.userid,productid:req.params.productId}})
console.log(response.data)
if(response.data.status == 'placed'){
    const jsondata=response.data 
    jsondata["by"]=req.session.email
    await publishMessage(jsondata)
    res.render("order_success",{order:response.data})
}
})



app.listen(8080,()=>{
    console.log("server started")
})
