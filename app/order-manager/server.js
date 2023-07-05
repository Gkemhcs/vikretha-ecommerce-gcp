
const express=require("express")
const app=express()
const { v4: uuidv4 } = require('uuid');
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})
app.use(require("body-parser").json())



function deliveryDate(){
    const currentDate = new Date();

// Add 10 days to the current date
const futureDate = new Date();
futureDate.setDate(currentDate.getDate() + 10);

// Format the future date as desired
const year = futureDate.getFullYear();
const month = String(futureDate.getMonth() + 1).padStart(2, '0');
const day = String(futureDate.getDate()).padStart(2, '0');

// Construct the date string
const expectedDeliveryDate = `${year}-${month}-${day}`;
return expectedDeliveryDate;
}


app.post("/create-order",(req,res)=>{
    const uuid = uuidv4();
    const orderid="order"+"-"+uuid
    const expectedDeliveryDate=deliveryDate()
    const userid=req.body.userid
    const productid=req.body.productid
    let quantity=1
    console.log(req.body)
    connection.query("INSERT INTO orders(orderid,userid,productid,deliveryDate,quantity) VALUES(?,?,?,?,?)",[orderid,userid,productid,expectedDeliveryDate,quantity],(err)=>{
        if(err) throw err 
        else{
        console.log("order placed")
        connection.query("SELECT * FROM catalog WHERE product_id = ?",[productid],(err,data)=>{
            if(err) throw err 
            else{
                res.json({status:"placed",orderid,expectedDeliveryDate,product_price:data[0].price,product_name:data[0].product_name})
            }
        })
      
        }
    })

})
app.get("/orders/:userId",(req,res)=>{
    userid=req.params.userId 
    connection.query("SELECT * FROM orders WHERE userid = ?",[Number(userid)],(err,data)=>{
        if(err) throw err 
        else{
            console.log(data)
           res.json(data) 
        }
    })
})
app.post("/order/cancel",(req,res)=>{
    connection.query("DELETE FROM orders WHERE orderid = ?",[req.body.orderId],(err)=>{
        if(err) throw err 
        else{
            res.json({status:"ok"})
        }
    })
})
app.listen(8080,()=>{
    console.log("server started")
})

