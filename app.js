var express                 = require("express"),
    app                     = express(),
    bodyParser              = require("body-parser"),
    ejs                     = require("ejs"),
    mongoose                = require("mongoose"),
    localStrategy           = require("passport-local"),
    flash                   = require("connect-flash"),
    passport                = require("passport"),
    methodOverride          = require("method-override");
    
//models
var User        = require("./models/user"),
    Comment     = require("./models/comment"),
    Prose       = require("./models/prose"),
    Question    = require("./models/question"),
    ForumPost   = require("./models/forumPost"),
    Poem        = require("./models/poem"),
    Contact     = require("./models/contacts");

app.locals.moment = require('moment');

var middleware = require("./middleware/index");
const sendOne = require('./mail').sendOne;
const sendReply = require('./mail').sendReply;

mongoose.connect("mongodb://localhost/ap_lit2");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//Passport config
app.use(require("express-session")({
    secret: "secret passphrase alpha charlie",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    
    next();
});


//main page
app.get("/", function(req, res){
    res.render("landing");
});

//forum routes
app.get("/forum", function(req, res){
    ForumPost.find({}, function(err, foundPosts){
        if(err){
            return res.redirect("back")
        } 
        res.render("forum/forums", {posts: foundPosts});
    })
    
});

app.get("/forum/new", middleware.isLoggedIn, function(req, res){
    res.render("forum/new");
});

app.get("/forum/:id", function(req, res){
    ForumPost.findById(req.params.id).populate("comments").exec(function(err, foundPost){
        if(err || !foundPost){
            req.flash("error", "Post not found");
            res.redirect("back");
        } else{
            res.render("forum/show", {post: foundPost});
        }
    });
});

app.delete("/forum/:id", function(req, res){
    ForumPost.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/forum")
        }
    })
})

app.post("/forum", function(req, res){
    ForumPost.create(req.body.post, function(err, newPost){
        if(err){
            res.redirect("back");
        } else{
            newPost.author.username = req.user.username; newPost.save();
            newPost.author.id = req.user._id; newPost.save();
            req.flash("success", "Forum post created");
            res.redirect("/forum");
        }
    })
});

//Poem Routes
app.get("/poems", function(req, res){
    Poem.find({}, function(err, foundPoems){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("poems/show", {poems: foundPoems});
        }
    });
});

app.get("/poems/:id", function(req, res){
    Poem.findById(req.params.id).populate("comments").exec(function(err, foundPoem){
        if(err || !foundPoem){
            req.flash("error", "Poem not found");
            res.redirect("back");
        } else{
            res.render("poems/poem", {poem: foundPoem});
        }
    });
});

//Prose Routes
app.get("/prose", function(req, res){
    Prose.find({}, function(err, foundProse){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("prose/show", {prose: foundProse});
        }
    });
});

app.get("/prose/:id", function(req, res){
    Prose.findById(req.params.id).populate("comments").exec(function(err, foundProse){
        if(err || !foundProse){
            req.flash("error", "Poem not found");
            res.redirect("back");
        } else{
            res.render("prose/prose", {prose: foundProse});
        }
    });
});


//Login routes
app.get("/login", function(req, res){
    res.render("auth/login");
});

app.post("/login", passport.authenticate("local",   //I need to get an error message in this
    {
        successRedirect: "/", 
        failureRedirect: "/login",
    }), function(req, res){
    res.render("landing");
});


//Register new User routes
app.get("/register", function(req, res){
    res.render("auth/register");
});

app.post("/register", function(req, res){
   if(req.body.password.length === 0 || req.body.username.length === 0){
        req.flash("error", "Please input a username or password");
        console.log("password/username error");
        return res.render("auth/register");
    }
    
    var newUser = new User({username: req.body.username, email:req.body.email});
    if(req.body.subscribe)
        newUser.isSubscribed = true;
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("auth/register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to APLit Hub "+user.username);
            res.redirect("/");
        });
    });
});


//Logout route
app.get("/logout", function(req, res){
    req.logout();
    req.flash("error", "Logged you out");
    res.redirect("/");
});

//comments post
app.post("/prose/:id/comments", middleware.isLoggedIn, function(req, res){
    Prose.findById(req.params.id, function(err, prose){
        if(err){
            console.log(err);
            res.redirect("/prose");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    prose.comments.push(comment._id);
                    prose.save();
                    req.flash("success", "Added comment");
                    res.redirect("/prose/"+prose._id);
                }
            });
            
        }
    });
});

app.post("/poems/:id/comments", middleware.isLoggedIn, function(req, res){
    Poem.findById(req.params.id, function(err, poem){
        if(err){
            console.log(err);
            res.redirect("/prose");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    poem.comments.push(comment._id);
                    poem.save();
                    req.flash("success", "Added comment");
                    res.redirect("/poems/"+poem._id);
                }
            });
            
        }
    });
});

app.post("/forum/:id/comments", middleware.isLoggedIn, function(req, res){
    ForumPost.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
            res.redirect("/forum");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    post.comments.push(comment._id);
                    post.save();
                    req.flash("success", "Added comment");
                    res.redirect("/forum/"+post._id);
                }
            });
            
        }
    });
});

//contact routes
app.get("/contact", middleware.isLoggedIn, function(req, res){
    res.render("contact");
});

app.post("/contact", middleware.isLoggedIn, function(req, res){
    var info = {
        author: {
            username: req.user.username,
            id: req.user._id
        },
        email: req.user.email,
        title: req.body.title,
        text: req.body.text
    }
    if(req.body.email && req.body.email.length != 0){
        info.email = req.body.email;
    }
    Contact.create(info, function(err, newContact){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            req.flash("success", "Contact message sent")
            res.redirect("/contact")
        }
    });
});

//admin routes
app.get("/admin/manage", middleware.checkAdmin, function(req, res){
    Contact.find({}, function(err, foundContacts){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("manage", {contact: foundContacts});
        }
    });
});

app.delete("/contact/:id", middleware.checkAdmin, function(req, res){
    Contact.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            console.log("deleted")
            res.redirect("/admin/manage");
        }
    })
});

app.get("/contact/:id/reply", middleware.checkAdmin, function(req, res){
    Contact.findById(req.params.id, function(err, foundContact){
        if(err){
            req.flash("error", "Something went wrong");
        } else if(foundContact.email.length == 0){
            req.flash("error", "This user does not have an email to reply to");
            res.redirect("/admin/manage");
        } else{
            res.render("reply", {message: foundContact});
        }
    })
});

app.post("/contact/:id/reply", middleware.checkAdmin, function(req, res){
    Contact.findById(req.params.id, function(err, foundContact){
        if(err){
            console.log(err);
            res.redirect("back");
        } else{
            var reply = {
                title: req.body.title,
                content: req.body.content,
                recipient: foundContact.email
            }
            sendReply(reply);
            Contact.findByIdAndRemove(req.params.id, function(err){
            if(err){
                console.log(err);
                res.redirect("back");
            } else{
                console.log("deleted")
                res.redirect("/admin/manage");
            }
    })
        }
    })
});


app.get("/admin", middleware.checkAdmin, function(req, res){
    res.render("admin-edit");
});

app.post("/poems/create", middleware.checkAdmin,  function(req, res){
    var poem = {title: req.body.title, author: req.body.author, text: req.body.content.replace(/\n/g, '<br/>')};
    Poem.create(poem, function(err, newPoem){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/admin/navigate");
        } else{
            req.flash("success", "Poem created!");
            res.redirect("/admin");
        }
    });
});

app.post("/prose/create", middleware.checkAdmin, function(req, res){
    var prose = {title: req.body.title, author: req.body.author, text: req.body.content.replace(/\n/g, '<br/>')};
    Prose.create(prose, function(err, newProse){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/admin");
        } else{
            req.flash("success", "Prose excerpt created!");
            res.redirect("/admin");
        }
    });
});

app.put("/prose/:id", middleware.checkAdmin, function(req, res){
    Prose.findByIdAndUpdate(req.params.id, req.body.prose, function(err, foundProse){
        if(err || !foundProse){
            console.log(err);
            req.flash("error", "Something went wrong");
            res.redirect("back")
        } else{
            res.redirect("/prose/"+req.params.id);
        }
    });
});

app.put("/poems/:id", middleware.checkAdmin, function(req, res){
    Poem.findByIdAndUpdate(req.params.id, req.body.poem, function(err, updatedPoem){
        if(err){
            res.redirect("/poem");
        } else{
            res.redirect("/poems/"+req.params.id)
        }
    });
});

app.get("/poems/:id/edit", middleware.checkAdmin, function(req, res){
    Poem.findById(req.params.id, function(err, foundPoem){
        if(err || !foundPoem){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("poems/edit", {poem: foundPoem});
        }
    });
});

app.get("/prose/:id/edit", middleware.checkAdmin, function(req, res){
    Prose.findById(req.params.id, function(err, foundProse){
        if(err || !foundProse){
            console.log(err);
            res.redirect("back");
        } else{
            res.render("prose/edit", {prose: foundProse});
        }
    });
});


app.delete("/prose/:id", middleware.checkAdmin, function(req, res){
    Prose.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/prose");
        } else{
            res.redirect("/prose");
        }
    });
});

app.delete("/poems/:id", middleware.checkAdmin, function(req, res){
    Poem.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/poems");
        } else{
            res.redirect("/poems");
        }
    });
});

//admin send email
app.post("/admin/send-mail", middleware.checkAdmin, function(req, res){
    if(req.body.type == "prose"){
        Prose.findOne({title: req.body.title}, function(err, foundProse){
            if(err){
                console.log(err);
                req.flash("Something went wrong");
                res.redirect("back");
            } else{
                User.find({isSubscribed: true}, function(err, users){
                    if(err){
                        res.redirect("back");
                    } else{
                        users.forEach( function(user){
                        if(user.email.length != 0){
                            var mailObj = {
                                title: foundProse.title,
                                author: foundProse.author,
                                content: foundProse.text, 
                                recipient: user.email,
                                type: "prose excerpt"
                            };
                            sendOne(mailObj);
                            req.flash("success", "Email sent")
                        }
                    });
                    }
                    
                });
            }
        });
    } else if(req.body.type == "poem"){
        Poem.findOne({title: req.body.title}, function(err, foundPoem){
            if(err){
                console.log(err);
                req.flash("Something went wrong");
                res.redirect("back");
            } else{
                User.find({isSubscribed: true}, function(err, users){
                    if(err){
                        res.redirect("back");
                    } else{
                        users.forEach( function(user){
                        if(user.email.length != 0){
                            var mailObj = {
                                title: foundPoem.title,
                                author: foundPoem.author,
                                content: foundPoem.text, 
                                recipient: user.email,
                                type: "poem"
                            };
                            sendOne(mailObj);
                            req.flash("success", "Email sent");
                        }
                        });
                    }
                });
            }
        });
    }
    res.redirect("/admin")
    
});

app.get("/surprise", function(req, res){
    res.render("surprise");
});

app.get("/frq", function(req, res){
    res.render("frq");
});



app.get("*", function(req, res){
    res.send("Sorry, page not found");
});



app.listen(process.env.PORT, process.env.IP, function(){
    console.log("School App running");
});