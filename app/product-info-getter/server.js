const express=require("express")
const app=express()
const bodyParser=require("body-parser")
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})
app.get("/product/:productId",(req,res)=>{
    connection.query("SELECT * FROM catalog WHERE product_id = ? ",[Number(req.params.productId)],(err,data)=>{
        if(err )throw err 
        else{
            res.json(data[0])
        }
    })
})
app.get("/buy/:productId",(req,res)=>{
    connection.query("SELECT * FROM catalog WHERE product_id = ? ",[Number(req.params.productId)],(err,data)=>{
        if(err) throw err 
        else{
            res.json(data[0])
        }
    })
})
app.listen(8080,()=>{
    console.log("server started")
})