const mongoose=require('mongoose');

const DoctorSchema=new mongoose.Schema({
    userId:{
       type:String,
       required:true
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    website:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    specilization:{
        type:String,
        required:true
    },
    experiance:{
        type:String,
        required:true
    },
    feePerconsoltation:{
        type:Number,
        required:true
    },
    timings:{
        type:Array,
        required:true
      },
      status:{
        type:String,
        default:'pending'
       }
},{timestamps:true})

const doctorModel=mongoose.model('Doctor',DoctorSchema);
module.exports=doctorModel