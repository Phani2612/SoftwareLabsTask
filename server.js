const Express = require('express')

require('dotenv').config();


const App = Express()

const mongoose = require('mongoose')

const CORS = require('cors')

const BCRYPT = require('bcryptjs')

const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');

const axios = require('axios')

const FormData = require('form-data');
const fs = require('fs');
const path = require('path'); // Importing the path module

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp storage for uploaded files


const storage = multer.memoryStorage();
const upload1 = multer({ storage });


const crypto = require('crypto');  // To generate a unique token


const Frontend_URL = process.env.FRONTEND_URL

const session = require("express-session");





App.use(
    session({
      name: "session_id", // Name of the session cookie
      secret: process.env.SESSION_SECRET, // Secret key for signing cookies
      resave: false, // Do not save the session if it was not modified
      saveUninitialized: false, // Do not save a session if it is new but uninitialized
    })
  );


App.use(Express.urlencoded())

App.use(CORS())

App.use(Express.json())



// Connect to MongoDB
mongoose.connect('mongodb+srv://Phani2612:2612@cluster0.nxfzz84.mongodb.net/SoftwareLabs?retryWrites=true&w=majority&appName=Cluster0', {
    
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));


const User_Schema = new mongoose.Schema({


     UT_Email : {

         type : String
     },

     UT_Password : {

         type : String
     },

     UT_Phone : {

        type : Number
     },

     UT_Photo : {

         type : String
     },

     UT_Bio : {

         type : String 
     },

     UT_Role : {

         type : String 
     },

     UT_IMDB : {

         type : String 
     },

     UT_Twitter : {

        type : String 
    },


    UT_Instagram : {

        type : String 
    },

    
    UT_Threads : {

        type : String 
    },

    UT_Full : {

         type : String
    }


})


const User_Table = mongoose.model('User_Table' , User_Schema)




const Create_Project_Schema = new mongoose.Schema({

      CP_Title : {
          type : String
      },

      CP_Type : {

         type : String
      },

      CP_Description : {

         type : String
      },

      CP_User : {

         type : String
      },

      CP_Cover_Photo : {

         type : String
      }
})


const Create_Project = mongoose.model('Create_Project' , Create_Project_Schema)



const Screen_Play_Schema = new mongoose.Schema({

       SP_Title : {
         type : String
       },

       SP_Synopsis : {

         type : String 
       },

       SP_Genre : {

         type : String
       },

       SP_Language : {

         type : String
       },

       SP_User : {

         type : String
       },


       SP_OID : {


         type : mongoose.Schema.Types.ObjectId,
         ref : 'Create_Project'
         
         
       },

       SP_Generated_Data : {


          type : String
       }
})

const Screen_Play = mongoose.model('Screen_Play' , Screen_Play_Schema)


const Treatment_Schema = new mongoose.Schema({

      T_Genre : {

         type : String 
      },

      T_Language : {

         type : String 
      },

      T_Overview : {

         type : String 
      },

      T_Charactersetup : {

         type : String 
      },

      T_User : {

         type : String 
      },

      T_Project_ID : {

         type : mongoose.Schema.Types.ObjectId,
         ref : 'Create_Project'
      },

      T_Generated_Data : {

         type : String
      },

      T_Title : {

         type : String
      }
})


const Treatment = mongoose.model('Treatment' , Treatment_Schema)


const Breakdown_Schema = new mongoose.Schema({

     B_User : {

         type : String
     },

     B_Project_ID : {

         type : mongoose.Schema.Types.ObjectId,
         ref : 'Create_Project'
     },

     B_Generated_Data : {

         type : String
     },

     B_Title : {

         type : String 
     },


})


const Breakdown = mongoose.model('Breakdown' , Breakdown_Schema)


const Session_Schema = new mongoose.Schema({

    S_User_ID : {

         type : mongoose.Schema.Types.ObjectId
    },

    S_Token : {

         type : String
    },

    S_Expiry: {
        type: Date,
        default: () => Date.now() + 120 * 60 * 1000, // 30 minutes from now
      },

    S_Last_Path : {

         type : String
    }

    
})

// Session_Schema.methods.refreshToken = function () {
//     this.SM_Session_Token = generateNewToken(); // Implement your token generation logic here
//     this.SM_Last_Updated = Date.now();
//     this.SM_Expiry = Date.now() + 120 * 60 * 1000; // Extend expiry time by 30 minutes
//     return this.save();
//   };


const Session = mongoose.model('Session' , Session_Schema)



App.post('/register' , async function(req,res)
{
    const { email, phoneNumber, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!email || !phoneNumber || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the user already exists
        const userExists = await User_Table.findOne({ UT_Email: email });
        
        if (userExists) {
            return res.status(409).json({
                redirect_url: '/login',
                message: 'User already exists. Please log in.',
            });
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Hash the password
        const hashedPassword = await BCRYPT.hash(password, 12);

        // Create a new user and save to the database
        const newUser = new User_Table({
            UT_Email: email,
            UT_Phone: phoneNumber,
            UT_Password: hashedPassword,
        });

        await newUser.save();
        console.log('User registered successfully');

        // Send success response
        res.status(201).json({ message: 'Registration successful! Please log in.', redirect_url: '/login' });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'An error occurred during registration. Please try again later.' });
    }
})




App.get("/check-auth", async function (req, res) {
    try {
      const token = req.headers.authorization; // Assuming token is sent in headers
  
      const session = await Session.findOne({
        S_Token: token,
      });
  
      if (session && new Date() < new Date(session.S_Expiry)) {
        return res.status(200).json({ authenticated: true });
      } else {
        return res.status(200).json({ authenticated: false });
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      return res.status(500).json({ authenticated: false });
    }
  });



  App.post("/updateSessionPath", async (req, res) => {

    console.log(req.body , "session update")

    const { path, SESSIONTOKEN_FROM_LOCAL } = req.body;
    // Assuming you're using sessions
  
    try {
      const session = await Session.findOne({
        S_Token: SESSIONTOKEN_FROM_LOCAL,
      });
  
      if (session) {
        session.S_Last_Path = path;
        await session.save();
        return res
          .status(200)
          .json({ message: "Session path updated successfully" });
      }
  
      return res.status(404).json({ message: "Session not found" });
    } catch (error) {
      console.error("Error updating session path:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });





App.post('/login', async function (req, res) {
    const { email, password } = req.body;

    

    const SESSIONID_info = req.sessionID;

 

    // Check if a user with the provided email exists in the database
    const userExists = await User_Table.findOne({ UT_Email: email });

    if (userExists) {

// Check if the user exists but does not have a password (Google account login case)
        if (!userExists.UT_Password) {
            res.status(401).json({
                message: 'Account exists. Please go back and log in with your Google account.',
                redirect_url: `${Frontend_URL}/login` // Update with your Google login route
            });


            return;
        }



        // Extract the hashed password from the database
        const hashedPassword = userExists.UT_Password;

        // Compare provided password with stored hashed password
        const isPasswordValid = await BCRYPT.compare(password, hashedPassword);

      

        if (isPasswordValid) {
            // User is authenticated, redirect them to the dashboard


let sessioninformation = await Session.findOne({S_User_ID : userExists._id })

console.log(sessioninformation)

if(sessioninformation)
{
    sessioninformation.S_Expiry = Date.now() + 120 * 60 * 1000; 

    sessioninformation.S_Token = SESSIONID_info;

    await sessioninformation.save()
}

else{


    const sessiondata = new Session({

        S_User_ID : userExists._id,

        S_Expiry : Date.now() + 120 * 60 * 1000,

        S_Token : SESSIONID_info
        

    })

    await sessiondata.save()
    
}

            res.status(200).json({
                message: 'User authenticated successfully',
                redirect_url: `${Frontend_URL}/dashboard`,
                SESSION_INFO : SESSIONID_info
            });
        } else {
            // Passwords do not match, prompt user to re-enter credentials
            res.status(401).json({
                message: 'Incorrect password. Please try again.'
            });
        }
    } else {
        // User does not exist, suggest they register an account
        res.status(404).json({
            message: 'User not found.please go back and register yourself.',
            redirect_url: `${Frontend_URL}/register`
        });
    }
});




App.put('/login', async (req, res) => {
    const { fullName, email, bio, role, imdbUrl, twitterUrl, instagramUrl, threadsUrl } = req.body;

    // Check if email is provided
    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        // Find the user by email
        const Userdetail = await User_Table.findOne({ UT_Email: email });

        if (!Userdetail) {
            return res.status(404).send('User not found');
        }

        // Update the user fields with the new data, if provided
        Userdetail.UT_Bio = bio || Userdetail.UT_Bio;
        Userdetail.UT_Role = role || Userdetail.UT_Role;
        Userdetail.UT_IMDB = imdbUrl || Userdetail.UT_IMDB;
        Userdetail.UT_Twitter = twitterUrl || Userdetail.UT_Twitter;
        Userdetail.UT_Instagram = instagramUrl || Userdetail.UT_Instagram;
        Userdetail.UT_Threads = threadsUrl || Userdetail.UT_Threads;
        Userdetail.UT_Full = fullName || Userdetail.UT_Full
        Userdetail.UT_Photo = req.body.photo || Userdetail.UT_Photo; // Optional photo, if provided
        Userdetail.UT_Phone = req.body.phone || Userdetail.UT_Phone; // Optional phone, if provided
        Userdetail.UT_Password = req.body.password || Userdetail.UT_Password; // Optional password, if provided

        // Save the updated user data
        await Userdetail.save();

        // Send a success response
        res.status(200).send('User data updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user data');
    }
});




App.get('/user/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
      const user = await User_Table.findOne({ UT_Email: email });
      
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      res.status(200).json({
        fullName: user.UT_Full,
        email: user.UT_Email,
        bio: user.UT_Bio,
        role: user.UT_Role,
        imdbUrl: user.UT_IMDB,
        twitterUrl: user.UT_Twitter,
        instagramUrl: user.UT_Instagram,
        threadsUrl: user.UT_Threads,
        photo: user.UT_Photo,
        // Add any other fields you want to return
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching user data');
    }
  });








App.post('/store-user', async function (req, res) {
    const { username, email, uid, profilePic } = req.body;
    const sessionId = req.sessionID;

    try {
        // Check if user already exists
        let user = await User_Table.findOne({ UT_Email: email });
        if (!user) {
            // If user doesn't exist, create a new user including the profile picture URL
            user = new User_Table({
                UT_Email: email,
                UT_Photo: profilePic
            });
            await user.save();

            // Create session data
            const sessionData = new Session({
                S_User_ID: user._id,
                S_Expiry: Date.now() + 120 * 60 * 1000, // 2 hours expiry
                S_Token: sessionId
            });
            await sessionData.save();

            // Set the session token in HttpOnly cookie for client-side security
            res.cookie('sessionToken', sessionId, { httpOnly: true, secure: true, maxAge: 120 * 60 * 1000 });

            return res.status(201).send({ message: 'User created successfully', session: sessionId });
        } else {
            // If user exists, update their session expiry
            let sessionInformation = await Session.findOne({ S_User_ID: user._id });
            sessionInformation.S_Expiry = Date.now() + 120 * 60 * 1000; // 2 hours expiry
            sessionInformation.S_Token = sessionId;


            await sessionInformation.save();

            // Set the session token in HttpOnly cookie for client-side security
            res.cookie('sessionToken', sessionId, { httpOnly: true, secure: true, maxAge: 120 * 60 * 1000 });

            return res.status(200).send({ message: 'User already exists', session: sessionId });
        }
    } catch (error) {
        console.error('Error storing user in database:', error);
        return res.status(500).send({ error: 'Error storing user in database' });
    }
});





// Request password reset
App.post('/forgot-password', async (req, res) => {
   

    const { email } = req.body;
    const user = await User_Table.findOne({ UT_Email : email });

    

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Generate a JWT token with expiration
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

   
    // Send email with reset link
    const resetLink = `${Frontend_URL}/reset-password?token=${token}`;
    const mailOptions = {
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
    };

    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
        auth: {
            user: 'phanidimple258@gmail.com',
            pass: 'upfuukbqvvxceqgk',
        },
    });

   

    transporter.sendMail(mailOptions, (error, info) => {
  
         console.log(info)

        if (error) {
            return res.status(500).send({message : 'Error sending email'});
        }


        res.send({message : 'Reset password link sent to your email'});
    });



});




// In your Express app

App.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User_Table.findById(decoded.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Hash the new password and update the user
        const hashedPassword = await BCRYPT.hash(newPassword, 12);
        user.UT_Password = hashedPassword;
        await user.save();

        res.send({ message: 'Password successfully reset' });
    } catch (error) {
        return res.status(401).send('Invalid or expired token');
    }
});



App.post('/create-project', async function(req, res) {
    const { title, type, description, User_Email } = req.body;

    try {
        // Save the new project document
        const project = await new Create_Project({
            CP_Title: title,
            CP_Type: type,
            CP_Description: description,
            CP_User: User_Email
        }).save();

        // Send the `_id` of the newly created project back in the response
        res.status(200).json({
            message: 'Project created successfully',
            projectId: project._id  // This will hold the MongoDB ObjectId
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Failed to create project. Please try again.' });
    }
});





// Backend - routes
App.get('/getprojects/:User', async function(req, res) {
    const User = req.params.User;
    try {
        const projects = await Create_Project.find({ CP_User: User });
        res.json({ projects }); // Send the project documents to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


App.get('/get-project/:OID', async (req, res) => {
    try {

        const OID = String(req.params.OID)

   

        const project = await Create_Project.findById(OID); // Fetch the project by ID
  
       

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});






App.post("/upload-cover-photo", upload1.single("coverPhoto"), async (req, res) => {
    const { OID } = req.body;

    if (!req.file) return res.status(400).send("No file uploaded.");

    try {
        // Find the project by OID
        const project = await Create_Project.findById({ _id: OID });

        if (!project) {
            return res.status(404).send("Project not found.");
        }

        // Convert image buffer to base64 string and include the data URI scheme
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Store the full base64 image string in the project document
        project.CP_Cover_Photo = base64Image;

        // Save the updated document
        await project.save();

        console.log('Image uploaded successfully');
        res.status(200).send({
            message: "Cover photo uploaded successfully.",
            coverPhoto: project.CP_Cover_Photo // Send the base64 image directly
        });

    } catch (error) {
        console.error("Error saving cover photo:", error);
        res.status(500).send("Internal Server Error");
    }
});








App.get('/getscript/:User/:OID', async function(req, res) {
    const User = req.params.User;

    const OID = req.params.OID
   

    try {
        // Fetch scripts based on the User and populate the SP_OID field
        const scripts = await Screen_Play.find({ SP_User: User }).populate('SP_OID'); // Assuming SP_OID is a reference


       

        // Filter scripts where SP_OID _id matches the OID from the URL
        const filteredScripts = scripts.filter(script => {

  

            return script.SP_OID && script.SP_OID._id.toString() === OID; // Comparing _id of SP_OID with the OID from params
        });



        // If no matching scripts found, send a 404 error
        if (filteredScripts.length === 0) {

          
            return res.status(404).json({ message: 'No matching scripts found for this user and OID.' });
        }

     

        // Send the filtered scripts back to the frontend
        res.json(filteredScripts);

    } catch (error) {
        console.error('Error fetching scripts:', error);
        res.status(500).json({ message: 'Error fetching scripts' }); // Send error response if fetching fails
    }
});






App.get('/gettreatment/:User/:OID', async function(req, res) {
    const User = req.params.User;

    const OID = req.params.OID

    try {
        // Fetch the treatments and populate T_Project_ID field
        const treatments = await Treatment.find({ T_User: User })
            .populate('T_Project_ID'); // Assuming T_Project_ID is a reference to a Project or similar collection

        // Filter treatments where CP_User matches the User
        const filteredTreatments = treatments.filter(treatment => {
            return treatment.T_Project_ID && treatment.T_Project_ID._id.toString() === OID;
        });

        // If no matching treatments found, send a 404 error
        if (filteredTreatments.length === 0) {
            return res.status(404).json({ message: 'No matching treatments found for this user.' });
        }

        // Send the filtered treatments back to the frontend
        res.json(filteredTreatments);

    } catch (error) {
        console.error('Error fetching treatments:', error);
        res.status(500).json({ message: 'Error fetching treatments' }); // Send error response if fetching fails
    }
});




App.get('/getbreakdown/:User/:OID', async function(req, res) {
    const User = req.params.User;

    const OID = req.params.OID

    try {
        // Fetch the breakdowns and populate the B_Project_ID field
        const breakdowns = await Breakdown.find({ B_User: User })
            .populate('B_Project_ID'); // Assuming B_Project_ID is a reference to a Project or similar collection

        // Filter breakdowns where CP_User matches the User
        const filteredBreakdowns = breakdowns.filter(breakdown => {
            return breakdown.B_Project_ID && breakdown.B_Project_ID._id.toString() === OID;
        });

        // If no matching breakdowns found, send a 404 error
        if (filteredBreakdowns.length === 0) {
            return res.status(404).json({ message: 'No matching breakdowns found for this user.' });
        }

        // Send the filtered breakdowns back to the frontend
        res.json(filteredBreakdowns);

    } catch (error) {
        console.error('Error fetching breakdowns:', error);
        res.status(500).json({ message: 'Error fetching breakdowns' }); // Send error response if fetching fails
    }
});



App.put('/Updateproject/:OID', async function (req, res) {
    const OID  = String(req.params.OID);
    const { CP_Title, CP_Type, CP_Description } = req.body;

    console.log(OID)

    try {
        // Fetch the current project data
        const currentProject = await Create_Project.findById(OID);
        if (!currentProject) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        // Create an update object with only changed fields
        const updateData = {};
        if (CP_Title && CP_Title !== currentProject.CP_Title) updateData.CP_Title = CP_Title;
        if (CP_Type && CP_Type !== currentProject.CP_Type) updateData.CP_Type = CP_Type;
        if (CP_Description && CP_Description !== currentProject.CP_Description) updateData.CP_Description = CP_Description;

        // If no fields are different, return a message without updating
        if (Object.keys(updateData).length === 0) {
            return res.json({ success: true, message: 'No changes detected.' });
        }

        // Update only the modified fields
        const result = await Create_Project.findByIdAndUpdate(OID, updateData, { new: true });

        res.json({ success: true, message: 'Project updated successfully.', data: result });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, message: 'Failed to update project.' });
    }
});



App.delete('/deleteproject/:OID', async function(req, res) {
    const { OID } = req.params;

    try {
        const deletedProject = await Create_Project.findByIdAndDelete(OID);

        if (deletedProject) {
            res.status(200).json({ success: true, message: 'Project deleted successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Project not found.' });
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, message: 'Failed to delete project.' });
    }
});


App.put('/updatescript/:OID' , async function(req , res)
{


    const OID = req.params.OID; // Get the document ID from the URL
    const { newTitle } = req.body; // Get the new title from the request body

    try {
        const updatedDocument = await Screen_Play.findByIdAndUpdate(
            OID,
            { SP_Title: newTitle }, // Update only the title
            { new: true } // Return the updated document
        );

        

        if (!updatedDocument) {
            return res.status(404).send('Document not found');
        }

        res.send(updatedDocument); // Return the updated document
    } catch (error) {
        res.status(500).send('Error updating title: ' + error.message);
    }


})



App.delete('/deletescript/:OID' , async function(req ,res)
{
    const OID = req.params.OID;

    try {
        const deletedScript = await Screen_Play.findByIdAndDelete(OID);
        
        if (!deletedScript) {
            return res.status(404).json({ message: 'Script not found' });
        }
        
        res.status(200).json({ message: 'Script deleted successfully', deletedScript });
    } catch (error) {
        console.error('Error deleting script:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})


App.put('/updatetreatment/:OID' , async function(req , res)
{


    const OID = req.params.OID; // Get the document ID from the URL
    const { newTitle } = req.body; // Get the new title from the request body

    try {
        const updatedDocument = await Treatment.findByIdAndUpdate(
            OID,
            { T_Title: newTitle }, // Update only the title
            { new: true } // Return the updated document
        );

        

        if (!updatedDocument) {
            return res.status(404).send('Document not found');
        }

        res.send(updatedDocument); // Return the updated document
    } catch (error) {
        res.status(500).send('Error updating title: ' + error.message);
    }


})



App.delete('/deletetreatment/:OID' , async function(req ,res)
{
    const OID = req.params.OID;

    try {
        const deletedScript = await Treatment.findByIdAndDelete(OID);
        
        if (!deletedScript) {
            return res.status(404).json({ message: 'Script not found' });
        }
        
        res.status(200).json({ message: 'Script deleted successfully', deletedScript });
    } catch (error) {
        console.error('Error deleting script:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})





App.put('/updatebreakdown/:OID' , async function(req , res)
{


    const OID = req.params.OID; // Get the document ID from the URL
    const { newTitle } = req.body; // Get the new title from the request body

    try {
        const updatedDocument = await Breakdown.findByIdAndUpdate(
            OID,
            { B_Title: newTitle }, // Update only the title
            { new: true } // Return the updated document
        );

        

        if (!updatedDocument) {
            return res.status(404).send('Document not found');
        }

        res.send(updatedDocument); // Return the updated document
    } catch (error) {
        res.status(500).send('Error updating title: ' + error.message);
    }


})



App.delete('/deletebreakdown/:OID' , async function(req ,res)
{
    const OID = req.params.OID;

    try {
        const deletedScript = await Breakdown.findByIdAndDelete(OID);
        
        if (!deletedScript) {
            return res.status(404).json({ message: 'Script not found' });
        }
        
        res.status(200).json({ message: 'Script deleted successfully', deletedScript });
    } catch (error) {
        console.error('Error deleting script:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})













const { GoogleGenerativeAI } = require("@google/generative-ai");

const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { type } = require('os');

const genAI = new GoogleGenerativeAI('AIzaSyCRIykCP5fUDlvnprIkkr2Tud0C7FrMFpk');

const fileManager = new GoogleAIFileManager('AIzaSyCRIykCP5fUDlvnprIkkr2Tud0C7FrMFpk');





App.post('/api/generation' , async function(req,res)
{
    const { title, synopsis, genre, language, User_Email , OID } = req.body; // Include userId

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Write a ${genre} screenplay in ${language}. 
    The title of the screenplay is "${title}". 
    The synopsis is: "${synopsis}". 
    Please write a detailed scene that captures the essence of the story, ensuring it follows proper film style screenplay formatting, with numbered pages. 
    The screenplay should be approximately 10 pages long.`;


    try {
        const result = await model.generateContent(prompt);
        const generatedScreenplay = result.response.text();

       

        // Save generated data to the Screen_Play collection
        const newScreenplay = new Screen_Play({
            SP_Title: title,
            SP_Synopsis: synopsis,
            SP_Genre: genre,
            SP_Language: language,
            SP_User: User_Email, 
            SP_OID: OID,
            SP_Generated_Data: generatedScreenplay,
        });

        await newScreenplay.save(); // Save to database

        // Send the generated content back in the response
        res.json({ screenplay: generatedScreenplay, OID: OID , Screen_Play_ID : newScreenplay._id });
    } catch (error) {
        console.error('Error generating screenplay:', error);
        res.status(500).json({ error: 'Failed to generate screenplay' });
    }


})






//used in Editingdashboard.js
App.get('/getgenerated/:OID', async (req, res) => {

   const OID = req.params.OID

    try {
        const check = await Screen_Play.findById({ _id: OID });
        if (!check) {
            return res.status(404).send({ error: 'Screenplay not found' });
        }
        res.json({ screenplay: check });
    } catch (error) {
        console.error('Error fetching screenplay:', error);
        res.status(500).send({ error: 'Failed to retrieve screenplay' });
    }
});


//used in Editorpage.js
App.put('/updateScreenplay/:OID', async function (req, res) {
    const { OID } = req.params;
    const { updatedContent } = req.body;

    try {
        const result = await Screen_Play.findByIdAndUpdate(
            OID,
            { SP_Generated_Data: updatedContent },
            { new: true }
        );

        if (result) {
            res.json({ success: true, message: 'Screenplay updated successfully.', data: result });
        } else {
            res.status(404).json({ success: false, message: 'Screenplay not found.' });
        }
    } catch (error) {
        console.error('Error updating screenplay:', error);
        res.status(500).json({ success: false, message: 'Failed to update screenplay.' });
    }
});


//used in Editorpage.js
App.put('/updateBreakdown/:OID', async function (req, res) {
    const { OID } = req.params;
    const { updatedContent } = req.body;

    try {
        const result = await Breakdown.findByIdAndUpdate(
            OID,
            { B_Generated_Data: updatedContent },
            { new: true }
        );

        if (result) {
            res.json({ success: true, message: 'Screenplay updated successfully.', data: result });
        } else {
            res.status(404).json({ success: false, message: 'Screenplay not found.' });
        }
    } catch (error) {
        console.error('Error updating screenplay:', error);
        res.status(500).json({ success: false, message: 'Failed to update screenplay.' });
    }
});


//used in Editorpage.js
App.put('/updateTreatment/:OID', async function (req, res) {
    const { OID } = req.params;
    const { updatedContent } = req.body;

    try {
        const result = await Treatment.findByIdAndUpdate(
            OID,
            { T_Generated_Data: updatedContent },
            { new: true }
        );

        if (result) {
            res.json({ success: true, message: 'Screenplay updated successfully.', data: result });
        } else {
            res.status(404).json({ success: false, message: 'Screenplay not found.' });
        }
    } catch (error) {
        console.error('Error updating screenplay:', error);
        res.status(500).json({ success: false, message: 'Failed to update screenplay.' });
    }
});








const STABILITY_API_KEY = 'sk-UHw5gZMuBpRB1THQAEmieUSFQZ7vDK0UFe6IUT45ibAmOwDA'; // Consider storing the API key securely
App.get('/image', async function(req, res) {
    // Create a new FormData instance inside the route handler
    const form = new FormData();
    form.append('prompt', "spiderman eating an Icecream");
    form.append('output_format', "webp");

    try {
        const response = await axios.post(`https://api.stability.ai/v2beta/stable-image/generate/ultra`, form, {
            headers: { 
                Authorization: `Bearer sk-UHw5gZMuBpRB1THQAEmieUSFQZ7vDK0UFe6IUT45ibAmOwDA`, // Replace with your actual API key
                ...form.getHeaders(), // Automatically sets the Content-Type
                Accept: "image/*", // Accept header to receive images
            },
            responseType: 'arraybuffer' // Expecting the response as an array buffer
        });


        console.log("Response Status:", response.status);
        console.log("Response Data:", response.data); // Print the raw response data

        if (response.status === 200) {
            const imagePath = path.join(__dirname, "lighthouse.webp"); // Absolute path to save the image
            fs.writeFileSync(imagePath, Buffer.from(response.data)); // Save the image

            // Serve the image file
            res.sendFile(imagePath, (err) => {
                if (err) {
                    console.error("Error serving the image:", err);
                    res.status(err.status).end();
                }
            });
        } else {
            throw new Error(`${response.status}: ${response.data.toString()}`);
        }
    } catch (error) {
        if (error.response) {
            const errorData = Buffer.from(error.response.data).toString('utf-8');
            console.error("Error generating image:", errorData);
            res.status(error.response.status).send("Error generating image: " + errorData);
        } else {
            console.error("Error generating image:", error.message);
            res.status(500).send("Error generating image: " + error.message);
        }
    }
});


//Storing the treatment data
App.post('/store-treatment', async (req, res) => {
    try {
        // Destructure request body
        const { genre, language, overview, characterSetup, OID, User_Email } = req.body;

        // Validate input
        if (!genre || !language || !overview || !OID || !User_Email) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Create a new Treatment instance
        const newTreatment = new Treatment({
            T_Genre: genre,
            T_Language: language,
            T_Overview: overview,
            T_Charactersetup: characterSetup,
            T_Project_ID: OID,
            T_User: User_Email,
            T_Title : 'untitled Treatment'
        });

        // Save the new treatment to the database
        const savedTreatment = await newTreatment.save();

        // Send a successful response with the saved treatment ID
        res.status(201).json({ message: 'Treatment stored successfully', id: savedTreatment._id });
    } catch (error) {
        console.error('Error storing treatment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// treatment generation by AI
App.post('/treatment/generation', async function (req, res) {
    const { OID, actOneText , TID } = req.body;

    try {
        // Fetch the Treatment document using the provided OID
        const treatmentData = await Treatment.findById({_id : TID});
        if (!treatmentData) {
            return res.status(404).json({ error: 'Treatment not found' });
        }

        // Extract necessary details from the fetched document
        const { T_Genre: genre, T_Language: language, T_Overview: overview, T_Charactersetup: characterSetup } = treatmentData;

        // Initialize the AI model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construct the prompt for the AI model
        const prompt = `Write a ${genre} screenplay in ${language}. 
        The overview is: "${overview}". 
        The characters are described as: "${characterSetup}". 
        Please write an Act One scene that captures the essence of the story, ensuring it follows proper film style screenplay formatting. 
        The Act One should incorporate the user-specified details: "${actOneText}".`;

        // Generate content using the AI model
        const result = await model.generateContent(prompt);
        const generatedAct = result.response.text(); // Get the generated Act One content

        // Save the generated data back to the existing treatment document or a new collection
        treatmentData.T_Generated_Data = generatedAct; // Assuming you want to save it in the existing document
        await treatmentData.save();

        // Send the generated content back in the response
        res.json({ screenplay: generatedAct, OID: OID, Treatment_ID: treatmentData._id });
    } catch (error) {
        console.error('Error generating screenplay:', error);
        res.status(500).json({ error: 'Failed to generate screenplay' });
    }
});




//used in Editingdashboard.js
App.get('/treatment/:OID', async (req, res) => {

    const OID = req.params.OID
    try {
        const check = await Treatment.findById({ _id: OID  });
        if (!check) {
            return res.status(404).send({ error: 'Screenplay not found' });
        }
        res.json({ screenplay: check });
    } catch (error) {
        console.error('Error fetching screenplay:', error);
        res.status(500).send({ error: 'Failed to retrieve screenplay' });
    }
});


//used in Editingdashboard.js
App.get('/breakdown/:OID', async (req, res) => {

    console.log('phanii')

    const OID = req.params.OID

    

    try {
        const check = await Breakdown.findById({ _id: OID  });

       
        if (!check) {
            return res.status(404).send({ error: 'Screenplay not found' });
        }
        res.json({ screenplay: check });
    } catch (error) {
        console.error('Error fetching screenplay:', error);
        res.status(500).send({ error: 'Failed to retrieve screenplay' });
    }
});









App.post('/break_generate/document', upload.single('file'), async function (req, res) {
    const filePath = req.file.path;

    const { User_Email, OID } = req.body;
    
    try {
        // Step 1: Store user email and project ID in MongoDB
        const newBreakdown = new Breakdown({
            B_User: User_Email,
            B_Project_ID: OID,
            B_Generated_Data: "", // Placeholder for generated data
            B_Title : 'Untitled breakdown'
        });

        // Save the initial document without generated data
        const savedBreakdown = await newBreakdown.save();

        // Step 2: Upload the file to the AI's file manager
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: req.file.mimetype,
            displayName: req.file.originalname,
        });

        if (!uploadResponse || !uploadResponse.file) {
            throw new Error("File upload to AI failed");
        }

        // Step 3: Generate content based on uploaded file
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri,
                },
            },
            { text: "Generate a scene breakdown of this document as a list." },
        ]);

        if (result && result.response && result.response.text) {
            const generatedText = await result.response.text();

            // Step 4: Update MongoDB document with generated data
            savedBreakdown.B_Generated_Data = generatedText;
            await savedBreakdown.save();

            // Step 5: Send the document's MongoDB ObjectID to the frontend
            res.json({ documentId: savedBreakdown._id, summary: generatedText });
        } else {
            throw new Error("No text returned from AI");
        }
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Failed to generate breakdown" });
    } finally {
        // Optional: Clean up the uploaded file from server storage
        // fs.unlinkSync(filePath);
    }
});

























App.listen(5000 , function()
{
     console.log("Server is running at 5000")
})