const User = require('../models/users');
const UserReview = require('../models/reviews');
const Stall = require('../models/stalls');

let { userID, stall_id, isLoggedIn, isEdit } = require('../app');

isLoggedIn = false;

function errorFn(err){
    console.log('Error fond. Please trace!');
    console.error(err);
}

function add(server){
    //webpages part
    const e = require('express');
        

    //note for peter: pakireplace yung iflast algorithm to fit the database design.
    server.get(['/', '/main'], async function(req, resp){
        try {
            const data_stall = await Stall.find().lean();
            isEdit = false;
            console.log(isLoggedIn);

            resp.render('main', {
                layout: 'index',
                title: 'TaftChoice',
                data_stall: data_stall,
                isLoggedIn: isLoggedIn,
                isEdit: isEdit
            });
        } catch (err) {
            console.error('Error fetching stalls:', err);
            // Handle the error
        }
    });


    //display review [raiki]
    server.get('/storereview', async function(req, res) {
        let stallId = parseInt(req.query.stallId);
        stall_id = stallId;

        try {
            const data_stall = await Stall.findOne({ 'stall-number': stall_id }).lean();
            const all_stall_data = await Stall.find().lean();
            const review_data = await UserReview.find({ 'stall-number': stallId }).lean();
            const users = await User.find().lean();

            console.log(stallId);
            console.log(data_stall);
            console.log(all_stall_data);
            console.log(review_data);
            console.log(users);
            console.log(isLoggedIn);

            res.render('storeView', {
                layout          : 'store-review',
                title           : data_stall['stall-name'],
                stall_image     : data_stall['stall-image'],
                stall_desc      : data_stall['stall-desc'],
                stall_must_try  : data_stall['stall-must-try'],
                data_stall      : data_stall,
                all_stall_data  : all_stall_data,
                review_data     : review_data,
                users           : users,
                stall_id        : stallId,
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit
            });
        } catch (errorFn) {
            console.error(errorFn);
            // Handle error response
            res.status(500).send(errorFn);
        }
    });


    server.get('/addreview', async function(req, res) {
        try {
            let stallId = parseInt(req.query.stallId);

            stall_id = stallId;
        
            const data_stall = await Stall.findOne({ 'stall-number': stall_id });      //isolated info the current stall clicked
            
            console.log(stall_id);
            console.log(data_stall); //empty array output
        
            const stall_name = data_stall['stall-name'];
            const stall_image = data_stall['stall-image'];
            
            console.log(stall_image);
        
            res.render('AddReview', {
                layout          : 'ReviewManagement',
                title           :  'Review: ' + stall_name,
                userID          :  userID,
                stall_image     :  stall_image,
                data_stall      :  data_stall,
                stall_id        :  stall_id,
                stall_name     :  stall_name,
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit
            });

        } catch (error) {
            console.error('Error while fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    server.get('/editreview', async function(req, res) {
        try {

            let reviewId = parseInt(req.query.reviewId);

            const review_data = await UserReview.findOne({ reviewID: reviewId });
        
            const stall_number = review_data['stall-number'];
        
            const stall_data = await Stall.findOne({ 'stall-number': stall_number });
            const stall_name = stall_data['stall-name'];
        
            isEdit = false;
        
            res.render('EditReview', {
                layout          : 'ReviewManagement',
                title           : 'Edit Review',
                stall_number    : stall_number,
                stall_name      : stall_name,
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit,
                reviewID        : reviewId
            });
                
        } catch (error) {
            console.error('Error while fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });




    //login part
    server.get('/login', function(req, res) {
        res.render('Login', {
            layout          : 'AccountManagement',
            title           : 'TaftChoice Login',
        });
    });

    server.post('/login', async function(req, res) {
        const { email, password } = req.body;

        try {
            // Find user by email in MongoDB
            const user = await User.findOne({ email });

            if (user && user.password === password) {
                // Save userID for info fetching
                userID = user.userID;
                console.log(userID);

                isLoggedIn = true;
                res.redirect('/main'); // Redirect to main page after successful login
            } else {
                // Handle incorrect credentials
                res.render('Login', {
                    layout: 'AccountManagement',
                    title: 'TaftChoice Login',
                    error: 'Invalid email or password. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error occurred during login:', error);
            res.status(500).send('Internal Server Error');
        }
    });


    server.post('/logout', function(req, res) {
        userID = null;
        isEdit = false;
        isLoggedIn = false;
        res.redirect('/main'); // Redirect to main page after logging out
    });


    server.get('/forgotpassword', function(req, res) {
        res.render('ForgotPassword', {
            layout          : 'AccountManagement',
            title           : 'Forgot Password',
        });
    });

    server.get('/signup', function(req, res) {
        res.render('SignUp', {
            layout          : 'AccountManagement',
            title           : 'TaftChoice SignUp',
        });
    });



    //for Profile View-Only(Guest)
    //this loads the profile-view.html file from MCO1
    server.get('/viewProfile', function(req, resp){
        const searchQuery = {username: req.query.username};
        const stallQuery = {stall_number: req.query['stall-number']};

        User.findOne(searchQuery).lean().then(function(userResult){
            let userID = userResult.userID;
            UserReview.find({userID:userID}).lean().then(function(reviewResult){
                Stall.find(stallQuery).lean().then(function(stallResult){
                    const name = userResult.name;
                    const isEdit = false;
                    resp.render('profile-view', {
                        layout: 'profile-index',
                        title           : name,
                        users           : userResult,
                        data_stall      : stallResult,
                        profile_review_list: reviewResult,
                        isLoggedIn      : isLoggedIn,
                        isEdit          : isEdit
                        //userID          : userID
                    });
                }).catch(errorFn);
            }).catch(errorFn);
        }).catch(errorFn);
    });

    
    //for profile owner(with additional delete and edit review buttons)
    //This loads profile.html file in MCO1
    server.get('/profile', function(req, resp){
        const searchQuery = {userID: userID};
        const stallQuery = {stall_number: req.query['stall-number']};
        User.findOne(searchQuery).lean().then(function(userResult){
            let userID = userResult.userID;
            UserReview.find({userID:userID}).lean().then(function(reviewResult){
                Stall.find(stallQuery).lean().then(function(stallResult){
                    const name = userResult.name;
                    const isEdit = true;
                    resp.render('profile', {
                        layout: 'profile-index',
                        title           : name,
                        users           : userResult,
                        data_stall      : stallResult,
                        profile_review_list: reviewResult,
                        isLoggedIn      : isLoggedIn,
                        isEdit          : isEdit
                        //userID          : userID
                    });
                }).catch(errorFn);
            }).catch(errorFn);
        }).catch(errorFn);
    });

    //edits the profile of the user
    server.get('/editProfile', function(req, resp){
        resp.render('edit-profile', {
            layout: 'edit-profile-index',
            title           : 'Edit Profile',
            isLoggedIn      : isLoggedIn
        });
    });
    
}

module.exports.add = add;