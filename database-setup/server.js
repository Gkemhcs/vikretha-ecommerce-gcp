const fs=require("fs")
const mysql=require("mysql")
const connection=mysql.createConnection({host:process.env.host,port:3306,user:process.env.user,password:process.env.password,database:process.env.database})
fs.readFile("./catalog.json",(err,data)=>{
    const catalog=JSON.parse(data)
  const values=catalog.map((row)=>[row["product_id"],row["product_name"],row["category"],row["price"],row["imgurl"],row["ratings"]])
   connection.query("INSERT INTO catalog VALUES ?",[values],(err)=>{
    if(err) throw err 
    else{
        console.log("data inserted")
    }
   })


    
    
})