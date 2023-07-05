const express=require("express")
const app=express()
const bodyParser=require("body-parser")
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})

app.get("/category/:type",(req,res)=>{
    console.log(req.params.type)
connection.query("SELECT * FROM catalog WHERE category = ?",[req.params.type],(err,data)=>{
    if(err) throw err 
    else{
        console.log(data)
        res.json(data)
    }
})
    
})
app.listen(8080,()=>{
    console.log("server started")
})