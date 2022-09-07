const express=require('express');
const User=require('../models/User');
const Doctor=require('../models/Doctor')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const authMiddleware=require('../middleware/auth');
const router=express.Router();
const moment = require("moment");
const Appointment =require("../models/Appointments")

router.post('/register',async(req,res)=>{
    try{
        
         const userExist=await User.findOne({email:req.body.email});
         if(userExist){
             return res.status(400).json({message:"User already exists"})
         }
       const password=req.body.password;
       const salt=await bcrypt.genSalt(10);
       const hash=await bcrypt.hash(password,salt);

       const newUser=new User({...req.body,password:hash});
        
       await newUser.save()
       res.status(200).json("User created succesfully")
     }catch(err){
        res.status(500).json({message:"Error creating User"})
    }
})

router.post('/login',async(req,res)=>{
    try{
       const user=await User.findOne({email:req.body.email});
       if(!user){
           return res.status(200).json({message:"User doesnt not exist", success:false})
       }
       const isMatch=await bcrypt.compare(req.body.password,user.password);
       if(!isMatch){
        return res.status(200).json({message:"Password is incorrect", success:false})
       }else{
           const token=jwt.sign({id:user._id},"supersecret",{
               expiresIn:"1d"
           })
           res.status(200).json({message:"login succesfully",success:true,data:token})

       }
    }catch(err){
        
    }
})


router.post('/get-user-info-bi-id',authMiddleware,async(req,res)=>{
   try{
    const user=await User.findOne({_id:req.body.userId});
    if(!user){
        return res.status(200).json({message:"User does not exist",success:false})
    }else{
        res.status(200).json({success:true,data:{
            ...user._doc,password:''
        }})
    }
   }catch(err){
       res.status(500).json({message:"eror getting user info",success:false,err})
   }
})

router.post('/apply-doctor',authMiddleware,async(req,res)=>{
    try{

        const newdoctor=new Doctor({...req.body,status:"pending"});
        await newdoctor.save();

        const adminUser=await User.findOne({isAdmin:true});

        const unseenNotifications=adminUser.unseenNotifications
        unseenNotifications.push({
            type:'new-doctor-request',
            message:`${newdoctor.firstName} ${" "} ${newdoctor.lastName} has applied for a doctor account`,
            data:{
                doctorId:newdoctor._id,
                name:newdoctor.firstName + " " + newdoctor.lastName,
            },
            onClickPath:"/admin/doctors"
        })
        await User.findByIdAndUpdate(adminUser._id,{unseenNotifications});
        res.status(200).json({
            success:true,
            message:"Doctor account applied for successfully"
        })
     }catch(err){
        res.status(500).json({message:"Error applying doctor"})
    }
})

router.post('/mark-notifications-as-seen',authMiddleware,async(req,res)=>{
    try{
        console.log(req.body.userId)
      const user=await User.findOne({_id:req.body.userId});
      const unseenNotifications=user.unseenNotifications;
    const seenNotifications=user.seenNotifications
    seenNotifications.push(...unseenNotifications)
      user.unseenNotifications=[];
      user.seenNotifications=seenNotifications;
      const updatedUser=await user.save();
      updatedUser.password=undefined;
      res.status(200).send({
          success:true,
          message:"All notifications marked as seen",
          data:updatedUser
      })
     }catch(err){
        res.status(500).json({message:"Error applying doctor"})
    }
})

router.post('/delete-all-notifications',authMiddleware,async(req,res)=>{
    try{
      const user=await User.findOne({_id:req.body.userId});
      user.seenNotifications=[];
      user.unseenNotifications=[];
      const updatedUser=await user.save()
      updatedUser.password=undefined;
      res.status(200).send({
          success:true,
          message:"ANotifications deleted",
          data:updatedUser
      })
     }catch(err){
        res.status(500).json({message:"Error "})
    }
})


router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
    try {
      const doctors = await Doctor.find({ status: "approved" });
      res.status(200).send({
        message: "Doctors fetched successfully",
        success: true,
        data: doctors,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  });
  
  router.post("/book-appointment", authMiddleware, async (req, res) => {
    try {
      req.body.status = "pending";
      req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
      req.body.time = moment(req.body.time, "HH:mm").toISOString();
      const newAppointment = new Appointment(req.body);
      await newAppointment.save();
      //pushing notification to doctor based on his userid
      const user = await User.findOne({ _id: req.body.doctorInfo.userId });
      user.unseenNotifications.push({
        type: "new-appointment-request",
        message: `A new appointment request has been made by ${req.body.userInfo.name}`,
        onClickPath: "/doctor/appointments",
      });
      await user.save();
      res.status(200).send({
        message: "Appointment booked successfully",
        success: true,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error booking appointment",
        success: false,
        error,
      });
    }
  });
  
  router.post("/check-booking-avilability", authMiddleware, async (req, res) => {
    try {
      const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
      const fromTime = moment(req.body.time, "HH:mm")
        .subtract(1, "hours")
        .toISOString();
      const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
      const doctorId = req.body.doctorId;
      const appointments = await Appointment.find({
        doctorId,
        date,
        time: { $gte: fromTime, $lte: toTime },
      });
      if (appointments.length > 0) {
        return res.status(200).send({
          message: "Appointments not available",
          success: false,
        });
      } else {
        return res.status(200).send({
          message: "Appointments available",
          success: true,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error booking appointment",
        success: false,
        error,
      });
    }
  });
  
  router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
    try {
      const appointments = await Appointment.find({ userId: req.body.userId });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  });

module.exports=router;