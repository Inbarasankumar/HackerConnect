const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check,validationResult}=require('express-validator');
const config = require('config');
const request = require('request');

const Profile = require('../../models/Profile');
const User = require('../../models/User');



//@route  GET api/profile/me
//@desc   Fetch the current user profile  
//@access Private
router.get('/me',auth,async (req,res)=>{
   try{
        const profile = await Profile.findOne({user:req.user.id}).populate('user',['name','avatar']);
        if(!profile)
        {
            return res.status(400).json({msg:'There is nor Profile for this user'});
        }
        return res.json(profile);
   }
   catch(err){
       console.error(err.message);
       res.status(500).send('Server Error');
   }
});

//@route  POST api/profile/
//@desc   Add and Update the profile
//@access Private
router.post('/',[auth,[
    check('status','Status is required').not().isEmpty(),
    check('skills','Skills are required').not().isEmpty()]],
    async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()})
        }
        const{company,website,location,status,
            skills,bio,githubusername
            ,youtube,facebook,instagram,linkedin,twitter} = req.body;
        let profileFields  = {};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(status) profileFields.status = status;
        if(bio) profileFields.bio = bio;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills){
            profileFields.skills = skills.split(',').map(skill=>skill.trim());
        }

        //Build socail Object
        profileFields.social = {};
        if(youtube) profileFields.social.youtube= youtube;
        if(instagram) profileFields.social.instagram= instagram;
        if(twitter) profileFields.social.twitter= twitter;
        if(facebook) profileFields.social.facebook= facebook;
        if(linkedin) profileFields.social.linkedin= linkedin;
        try{
            let profile = await Profile.findOne({user:req.user.id});
            //if find update one
            if(profile){
                profile = await Profile.findOneAndUpdate({user:req.user.id},{$set:profileFields},{new:true});
                return res.json(profile);
            }            
            // create 
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
            
        }
        catch(err){
            console.error(err.message);
            return res.status(500).send('server error')
        }
    });

//@route GET api/profile
//@desc  Get all profiles
//@access Public
router.get('/',async(req,res)=>{
    try {
    let allprofiles =await Profile.find().populate('user',['name','avatar']);
    res.json(allprofiles);   
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
        
    }
});

//@route GET api/profile/user/:user_id
//@desc Get the profile for the user id
//@access Public
router.get('/user/:user_id',async(req,res)=>{
try {
    let profile = await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);
    return res.json(profile);
} catch (err) {
    console.error(err.message);
    if(err.kind==='ObjectId'){
        return res.status(400).json({msg:'Profile not found'})
    }
    return res.status(500).send('Server Error')
    
}
});


//@route  DELETE api/profile/
//@desc   Delete profile and user
//@access Private
router.delete('/',auth,async(req,res)=>{
    try {
        await Profile.findOneAndDelete({user:req.user.id});
        await User.findOneAndDelete({_id:req.user.id});
        return res.json({msg:'User Deleted'});
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
        
    }
 });

 //@route PUT api/profile/experience
 //@desc  add profile experience
 //@access Private
 router.put('/experience',[auth,
    [check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),]],
    async(req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()})
        };
        const {
            title,
            company,
            from,
            to,
            current,
            location,
            description
        }=req.body;
        const newExp ={
            title,
            company,
            from,
            to,
            current,
            location,
            description
        }
        try{
            let profile =await Profile.findOne({user:req.user.id});
            
            profile.experience.unshift(newExp);
            await profile.save();

            return res.json(profile);
        }catch(err){
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    });

//@route DELETE api/profile/experience/:exp_id
//@desc  Delete the profile experience
//@access Private
router.delete('/experience/:exp_id',auth,
   async (req,res)=>{
        try {
            let profile = await Profile.findOne({user:req.user.id});
            const removeIndex = profile.experience.map(item =>item.id).indexOf(req.params.exp_id);
            profile.experience.splice(removeIndex,1);
            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    });  

//@route PUT api/profile/education
//@desc  Add the education details
//@access Private
router.put('/education',[auth,[
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of Study is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()
    ]],
    async(req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;
        const newEducation ={
            school,     
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        };
        try {

        const profile = await Profile.findOne({user:req.user.id});
        profile.education.unshift(newEducation);
        await profile.save();
        await res.json(profile);

        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error')
            
        }
        
    }
);

//@route DELETE api/profile/education/:edu_id
//@desc  Delete Education details
//@access Private
router.delete('/education/:edu_id',auth,
    async(req,res)=>{
        try {
            let profile = await Profile.findOne({user:req.user.id});
            const removeIndex = profile.education.map(item =>item.id).indexOf(req.params.edu_id);
            profile.education.splice(removeIndex,1);
            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error')
        }
            
    }
);

//@route  GET api/profile/github/:username
//@desc   Get user repos from the github  
//@access Public
router.get('/github/:username',async (req,res)=>{
    try {
        const options = {
         uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc
           &client_id=${config.get('githubClient')}&client_secret=${config.get('githubSecret')}`,
        method:'GET',
        headers:{'user-agent':'node-js'}
        };
        request(options,(error,response,body)=>{
            if(error) console.error(error);
            if(response.statusCode !== 200){
                res.status(404).json({msg:'No Github Profile found'})
            }
            return res.json(JSON.parse(body));
        })
      
      }  
      catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: 'No Github profile found' });
      }
 });
module.exports = router;