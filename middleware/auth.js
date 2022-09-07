const jwt =require('jsonwebtoken');




module.exports=async(req,res,next)=>{
    try{
        const token =req.headers['authorization'].split(" ")[1];
        jwt.verify(token,"supersecret",(err,decode)=>{
   
           if(err){
               res.status(401).json({message:"auth Failed",success:false})
           }else{
               req.body.userId=decode.id
               next()
           }
        })
    }catch(err){
      return res.status(500).json({message:"Auth Failed",success:false})
    }
}