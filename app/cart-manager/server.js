const express=require("express")
const app=express()
const bodyParser=require("body-parser")
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})
app.use(bodyParser.json())
app.use(express.json())
app.post("/add",(req,res)=>{
    const {userId,productId}=req.body 
    connection.query("SELECT * FROM cart WHERE userId = ? AND productId= ? ",[userId,productId],(err,data)=>{
        if(err) throw err 
        else{
            if(data.length == 1){
                res.json({status:"alreadyPresent"})
                
            }
            else{
                connection.query("INSERT INTO cart VALUES (?,?)",[userId,productId],(err)=>{
                    if(err) throw err 
                    else{
                        res.json({status:"ok"})
                    }
                })

            }
        }
    })

    console.log(req.body)

})
app.get("/cart/:userId",(req,res)=>{
    console.log("request recieved")
    connection.query("SELECT productId FROM  cart WHERE userId = ?",[Number(req.params.userId)],(err,data)=>{
        if(err) throw err 
        
        else{
       if(data.length == 0){
        res.json({cart:"empty",items:{}})
        }
          else{
            let productIds=[]
            data.forEach(element => {
                productIds.push(element.productId)
            });
            connection.query("SELECT * FROM catalog WHERE product_id IN  (?)",[productIds],(err,results)=>{
                console.log("results",results)
                res.json({cart:"exists",items:results})
            })
          }
        }
    })
})
app.post("/cart/delete",(req,res)=>{
    connection.query("DELETE FROM cart WHERE userId = ? AND productId = ?",[req.body.userId,req.body.productId],(err)=>{
        if(err) throw err 
        else{
            res.json({status:"ok"})
        }
    })
})
app.listen(8080,()=>{
    console.log("server started")
})