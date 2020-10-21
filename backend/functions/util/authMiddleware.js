const {admin} = require('./admin')
const {db} = require('../util/admin')

// MIDDLEWILE parse token from request header, get userName from DB 
exports.AuthMiddle = (req,res,next) => {
    let userInfo;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        userInfo = req.headers.authorization.split('Bearer ')[1]
    }else{
        return res.status(403).json({error: "unauthorized"})
    }
    admin.auth().verifyIdToken(userInfo)
    .then(info =>{
        userInfo = info
        req.user = info
        return db.collection('users')
        .where('userId','==',req.user.uid)
        .limit(1)
        .get()
    })
    .then(data =>{
        req.user.userName = data.docs[0].data().userName
        return next()
    })
    .catch((err) => {
        console.log(err)
        return res.status(403).json({error:err})
    })
}