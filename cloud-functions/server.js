const functions=require("@google-cloud/functions-framework")
const axios=require("axios")
async function sendEmail(body,receiver,API_KEY){
   
    const result=await axios({method:"POST",url:"https://api2.juvlon.com/v4/httpSendMail",headers:{'Content-Type':"application/json"},data:{"ApiKey":API_KEY,requests:[{"subject":"order recieved successfully","from":"r190081@rguktrkv.ac.in","body":body,"to":receiver}]}})
return result.data
}

functions.cloudEvent("email-sender",async(event)=>{
  data=Buffer.from(event.data.message.data,"base64").toString()
 jsondata=JSON.parse(data)
 body =`HEY THERE \n ,YOUR ORDER WAS SUCCESSFULLY PLACED AND YOUR ORDER ID IS ${jsondata.orderid} \n AND PRODUCT YOU HAVE ORDERED IS ${jsondata.product_name} WHICH COSTS ₹ ${jsondata.product_price} . \n THANKS FOR SHOPPING IN VIKRETHA STAY TUNED FOR AMAZING  OFFERS.\n YOUR ORDER IS CURRENTLY PREPARED TO SHIP AND THE DELIVERY CAN BE DONE AROUND ${jsondata.expectedDeliveryDate} `

   const response=await sendEmail(body,jsondata.by,process.env.APIKEY)
   console.log(response)
})
