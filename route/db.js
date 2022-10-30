
const MongoDB = require('mongodb')


const Config = require('./config');
const { MongoClient } = require('mongodb');


const ObjectID = MongoDB.ObjectID

class Db {


    static getInstance(){
        if(!Db.instance){
            Db.instance=new Db();
        }
        return  Db.instance;
    }

    constructor(){
        this.dbClient='';
        this.connect();
    }

    // 连接数据库
    connect() {
      let _that=this;
        return new Promise((res, req) => {
            if (!_that.dbClien) {  // 解决数据库多次连接的问题
                MongoClient.connect(Config.dbUrl, (err, client) => {
                    if (err) {
                        req(err)
                    }else{
                        const db = client.db(Config.dbName)
                        _that.dbClien = db
                        res(db)
                    }
                })
            }else{
                res(_that.dbClien)
            }
        })
    }

    // 查询数据
    find(collecionName, json) {
        return new Promise((res, req) => {
            this.connect().then((db) => {
                const result = db.collection(collecionName).find(json)
                result.toArray((err,docs) => {
                    if (err) {
                        req(err)
                        return
                    }
                    res(docs)
                })
            })
        })
    }

        // 分页查询数据
    count(collectionname,json,limit,skip) {
        return new Promise((res, req) =>{
            this.connect().then((db) => {
                const result = db.collection(collectionname).find(json).limit(limit).skip(skip)
                result.toArray(function (err,docs) {
                // callback(err,docs);
                if (err) {
                    req(err)
                    return
                }
                res(docs)
                })
            })
        })
    }
	
	// 统计数量
	countNum(collecionName, json) {
	    return new Promise((res, req) => {
	        this.connect().then((db) => {
	            const num = db.collection(collecionName).find(json).count()
	            
				res(num)
	        })
	    })
	}
	
	//获取指定字段最大值
	max(collecionName, field, json){
		if(!json){
			json = {}
		}
		
		return new Promise((res, req) => {
            this.connect().then((db) => {
				const result = db.collection(collecionName).findOne(json).sort({field: 1}).limit(1)
				const max = 0
				
				if(!result){
					res(max)
				}else{
					result.toArray(function(err, docs){
						max = docs[field]
						if (err) {
							req(err)
						}
						res(max)
					})
				}
				
            })
        })
	}

    // 更新数据
    update(collecionName, json1, json2) {
        return new Promise((res, req) => {
            this.connect().then((db) => {
                db.collection(collecionName).updateOne(json1, {
                    $set: json2
                }, (err, result) => {
                    if (err) {
                        return req(err)
                    }else{
                        res(result)
                    }
                })
                
            })
        })
    }

    // 添加数据
    insert(collecionName, json) {
        return new Promise((res, req) => {
            this.connect().then((db) => {
                db.collection(collecionName).insertOne(json, (err, result) => {
                    if (err) {
                        return req(err)
                    }else{
                        res(result)
                    }
                })
                
            })
        })

    }
    // 批量添加数据
    insertMany(collecionName, json) {
        return new Promise((res, req) => {
            this.connect().then((db) => {
                db.collection(collecionName).insertMany(json, (err, result) => {
                    if (err) {
                        return req(err)
                    }else{
                        res(result)
                    }
                })
                
            })
        })

    }

    // 删除数据
    remove(collecionName, json) {
        return new Promise((res, req) => {
            this.connect().then((db) => {
                db.collection(collecionName).remove(json, (err, result) => {
                    if (err) {
                        return req(err)
                    }else{
                        res(result)
                    }
                })
                
            })
        })
    }
	
	// 查询数据
	findObj(collecionName, json, order, limit) {
	    return new Promise((res, req) => {
	        this.connect().then((db) => {
	            const result = db.collection(collecionName).find(json).sort(order).limit(limit)
	            result.toArray((err,docs) => {
	                if (err) {
	                    req(err)
	                    return
	                }
	                res(docs)
	            })
	        })
	    })
	}
	//随机查询
	findRandom(collecionName, json, randomNum) {
		return new Promise((res, req) => {
		    this.connect().then((db) => {
		        const result = db.collection(collecionName).aggregate([{$match:json}, {$sample:{size: randomNum}}])
		        result.toArray((err,docs) => {
		            if (err) {
		                req(err)
		                return
		            }
		            res(docs)
		        })
		    })
		})
	}

    // 把mongodb里id做转换
    getObjectID(id) {
        return new ObjectID(id);  
    }

}

// const myDb = new Db()
// // const myDb = Db.getInstance()

// // setTimeout(() => {
//     myDb.find('user', {}).then((data) => {
//         console.log(data);
//     })
// // }, 0);

module.exports=Db.getInstance();
