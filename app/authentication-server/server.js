const express=require("express")
const app=express()
const bodyParser=require("body-parser")
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})
app.use(bodyParser.json())
app.post("/register",(req,res)=>{
    console.log(req.body)

   const {username,email,password}=req.body 
connection.query("INSERT INTO users(username,email,password) VALUES (?,?,?)",[username,email,password],(err)=>{
    if(err) throw err 
    else{
        res.send("ok")
    }
})
})
app.post("/login",(req,res)=>{
    console.log("login")
    console.log(req.body)
    const  {email,password}=req.body
    connection.query("SELECT * FROM users WHERE email = ?",[email],(err,data)=>{
        if(err) throw err 
        
        else{
            if(data.length == 0){
                res.json({loginstatus:"notexists"})
            } else {
            if(data[0].password == password){
                res.json({userid:data[0].userid,email:email,loginstatus:"success"})
            }
            else{
                res.json({loginstatus:"incorrect"})
            }
           
        }
        }
    })
})
app.listen(8080,()=>{
    console.log("server started")
})