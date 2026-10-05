const mongoose=require("mongoose");

const IncomeSchema=new mongoose.Schema({
  userId:{type: mongoose.Schema.Types.ObjectId,ref:"User", required:true},
  icon:{type: String},
  source:{type:String , required:true}, //Example: Salary , FreeLance, etc 
  description:{type:String, trim:true, maxlength:100, default:""},
  amount:{type:Number, required:true},
  date:{type: Date,default:Date.now},

},{timestamps: true });

module.exports=mongoose.model("Income",IncomeSchema);