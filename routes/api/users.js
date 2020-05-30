const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const brcypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config  = require('config');
const {check,validationResult} = require('express-validator');
const User = require('../../models/User');


//@route  Post api/users
//@desc   Register user 
//@access Public
router.post('/',[
    check('name','Name is required').not().isEmpty(),
    check('email','Please enter a valid email').isEmail(),
    check('password','Please Enter a password with minimum of 6 characters or more').isLength({min:6})
],
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const {name,email,password} = req.body;
    try{
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({errors:[{msg:'User already exist'}]})
        }
        const avatar = gravatar.url(email,{
            s:'200',
            r:'pg',
            d:'mm'
        })
        user = new User({
            name,
            email,
            avatar,
            password
        })
        const salt = await brcypt.genSalt(10); 
        user.password = await brcypt.hash(password,salt);
        await user.save();
        const payload = {
            user :{
                id:user.id
            }
        }
        jwt.sign(payload,
            config.get('jwtSecret'),
            {expiresIn:36000},
            (err,token)=>{
                if(err) throw err;
                res.json({token})
            })
       
    }
    catch(err){
    console.log(err.message);  
    return res.status(500).send('Server Error');    
    }
   });

module.exports = router;