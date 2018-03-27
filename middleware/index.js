var ForumPost = require("../models/forumPost");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkPostOwnership = function(req, res, next){
    if(req.isAuthenticated()){
         ForumPost.findById(req.params.id, function(err, foundPost){
        if(err || !foundPost){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else{
            if (!foundPost) {
                    req.flash("error", "Item not found.");
                    return res.redirect("back");
                }
            if(foundPost.author.id.equals(req.user._id)){
                next();
            } else{
                req.flash("error","You don't have permission to do that");
                res.redirect("back");
            }
        }
        });
    } else{
        req.flash("error","You need to be logged in to do that");
        res.redirect("back");
    }
}
    


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}
    


middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
         Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err || !foundComment){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else{
            if(foundComment.author.id.equals(req.user._id)){
                next();
            } else{
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        }
        });
    } else{
        req.flash("error","You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkAdmin = function(req, res, next){
        if(req.isAuthenticated() && req.user.isAdmin){
            return next();
        }
     else{
        req.flash("error", "You do not have that permission");
        res.redirect("/");
    }
   
}

module.exports = middlewareObj;